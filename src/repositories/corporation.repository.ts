import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Corporation } from '../models/corporation.entity';

@Injectable()
export class CorporationRepository extends Repository<Corporation> {
  constructor(private dataSource: DataSource) {
    super(Corporation, dataSource.createEntityManager());
  }

  async findById(id: number): Promise<Corporation | null> {
    return this.findOne({
      where: { id },
      relations: ['admin', 'members'],
    });
  }

  async findByAdmin(adminId: number): Promise<Corporation[]> {
    return this.find({
      where: { adminId },
      relations: ['members'],
    });
  }

  async findWithMembers(id: number): Promise<Corporation | null> {
    return this.findOne({
      where: { id },
      relations: ['admin', 'members'],
    });
  }
}
