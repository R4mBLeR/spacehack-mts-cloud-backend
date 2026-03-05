// src/console/repositories/console-session.repository.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import {
  ConsoleSessionEntity,
  ConsoleSessionStatus,
} from '../models/console.entity';

@Injectable()
export class ConsoleSessionRepository {
  // Исправлено: делаем public для доступа из сервиса
  constructor(
    @InjectRepository(ConsoleSessionEntity)
    public readonly repo: Repository<ConsoleSessionEntity>,
  ) {}

  async create(
    data: Partial<ConsoleSessionEntity>,
  ): Promise<ConsoleSessionEntity> {
    const session = this.repo.create(data);
    return this.repo.save(session);
  }

  async findById(id: string): Promise<ConsoleSessionEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByClientId(clientId: string): Promise<ConsoleSessionEntity | null> {
    return this.repo.findOne({
      where: { clientId },
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveByVmId(vmId: number): Promise<ConsoleSessionEntity[]> {
    return this.repo.find({
      where: {
        vmId,
        status: ConsoleSessionStatus.ACTIVE,
      },
    });
  }

  async findActiveByClientId(
    clientId: string,
  ): Promise<ConsoleSessionEntity | null> {
    return this.repo.findOne({
      where: {
        clientId,
        status: ConsoleSessionStatus.ACTIVE,
      },
    });
  }

  async updateStatus(
    id: string,
    status: ConsoleSessionStatus,
    errorMessage?: string,
  ): Promise<void> {
    const update: any = { status };
    if (errorMessage) update.errorMessage = errorMessage;
    if (status === ConsoleSessionStatus.DISCONNECTED) {
      update.disconnectedAt = new Date();
    }
    await this.repo.update(id, update);
  }

  async updateTraffic(
    id: string,
    received: number,
    sent: number,
  ): Promise<void> {
    await this.repo.update(id, {
      bytesReceived: received,
      bytesSent: sent,
    });
  }

  async closeSession(id: string): Promise<void> {
    await this.repo.update(id, {
      status: ConsoleSessionStatus.DISCONNECTED,
      disconnectedAt: new Date(),
    });
  }

  async getActiveSessions(): Promise<ConsoleSessionEntity[]> {
    return this.repo.find({
      where: { status: ConsoleSessionStatus.ACTIVE },
      order: { createdAt: 'DESC' },
    });
  }

  async cleanupOldSessions(hours: number = 24): Promise<number> {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    const result = await this.repo.delete({
      createdAt: LessThan(cutoff),
      status: ConsoleSessionStatus.DISCONNECTED,
    });
    return result.affected || 0;
  }

  async getSessionStats(): Promise<any> {
    const stats = await this.repo
      .createQueryBuilder('session')
      .select([
        'COUNT(*) as total',
        `SUM(CASE WHEN session.status = '${ConsoleSessionStatus.ACTIVE}' THEN 1 ELSE 0 END) as active`,
        `SUM(CASE WHEN session.status = '${ConsoleSessionStatus.DISCONNECTED}' THEN 1 ELSE 0 END) as disconnected`,
        `SUM(CASE WHEN session.status = '${ConsoleSessionStatus.ERROR}' THEN 1 ELSE 0 END) as errors`,
      ])
      .getRawOne();

    const byVm = await this.repo
      .createQueryBuilder('session')
      .select(['session.vmId', 'COUNT(*) as count'])
      .where(`session.status = '${ConsoleSessionStatus.ACTIVE}'`)
      .groupBy('session.vmId')
      .getRawMany();

    return {
      total: parseInt(stats.total),
      active: parseInt(stats.active),
      disconnected: parseInt(stats.disconnected),
      errors: parseInt(stats.errors),
      activeByVm: byVm.reduce((acc, row) => {
        acc[row.session_vmId] = parseInt(row.count);
        return acc;
      }, {}),
    };
  }
}
