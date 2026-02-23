import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Session } from '../models/session.entity';
import { AuthService } from '../services/auth.service';
import { AuthUtils } from '../utils/auth.utils';

@Injectable()
export class SessionRepository extends Repository<Session> {
  constructor(private dataSource: DataSource) {
    super(Session, dataSource.createEntityManager());
  }

  async findSessionById(id: number): Promise<Session | null> {
    return this.findOneBy({ user_id: id });
  }

  async findSessionByToken(token: string): Promise<Session | null> {
    const session = await this.findOne({
      where: { refresh_token: token },
      relations: ['user'],
    });
    return session;
  }

  async addSession(user_id: number, token: string): Promise<Session> {
    return this.save({ user_id: user_id, refresh_token: token });
  }

  async updateToken(oldToken: string, newToken: string): Promise<string> {
    await this.update({ refresh_token: oldToken }, { refresh_token: newToken });
    const updatedSession = await this.findOne({
      where: { refresh_token: newToken },
    });
    if (!updatedSession) {
      throw new Error('SESSION_NOT_FOUND_AFTER_UPDATE');
    }
    return updatedSession.refresh_token;
  }
}
