// repositories/user.repository.ts - Только работа с БД
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { User } from '../models/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { Role } from '../models/role.entity';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
    private readonly entityManager: EntityManager,
  ) {}

  async findAllUsers(): Promise<User[]> {
    return this.repository.find();
  }

  async findUserById(id: number): Promise<User | null> {
    return this.repository.findOneBy({ id });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.repository.findOneBy({ email });
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return this.repository.findOneBy({ username });
  }

  async findUsersByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<User[]> {
    return await this.repository.find({
      where: [{ email: email }, { username: username }],
    });
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return this.repository.save(user);
  }

  async save(user: User): Promise<User> {
    return this.repository.save(user);
  }
}
