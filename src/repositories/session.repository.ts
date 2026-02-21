import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from '../models/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { Session } from '../models/session.entity';

@Injectable()
export class SessionRepository extends Repository<Session> {
  constructor(private dataSource: DataSource) {
    super(Session, dataSource.createEntityManager());
  }

  async findTokenById(id: number): Promise<Session | null> {
    return this.findOneBy({ user_id: id });
  }

  async addToken(id: number, token: string): Promise<Session> {
    return this.save({ user_id: id, refresh_token: token });
  }
}
