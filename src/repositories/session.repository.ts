import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Session } from '../models/session.entity';

@Injectable()
export class SessionRepository {
  constructor(
    @InjectRepository(Session)
    private readonly repository: Repository<Session>,
  ) {}

  async findSessionById(id: number): Promise<Session | null> {
    return this.repository.findOneBy({ user_id: id });
  }

  async findSessionByToken(token: string): Promise<Session | null> {
    const session = await this.repository.findOne({
      where: { refresh_token: token },
      relations: ['user'],
    });
    return session;
  }

  async addSession(user_id: number, token: string): Promise<Session> {
    return this.repository.save({ user_id: user_id, refresh_token: token });
  }

  async deleteSessionByToken(refresh_token: string): Promise<DeleteResult> {
    return await this.repository.delete({
      refresh_token: refresh_token,
    });
  }

  async deleteAllSession(user_id: number): Promise<DeleteResult> {
    return await this.repository.delete({
      user_id: user_id,
    });
  }

  async updateToken(oldToken: string, newToken: string): Promise<string> {
    await this.repository.update({ refresh_token: oldToken }, { refresh_token: newToken });
    const updatedSession = await this.repository.findOne({
      where: { refresh_token: newToken },
    });
    if (!updatedSession) {
      throw new Error('SESSION_NOT_FOUND_AFTER_UPDATE');
    }
    return updatedSession.refresh_token;
  }
}
