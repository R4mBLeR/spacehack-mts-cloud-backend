// repositories/user.repository.ts - Только работа с БД
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { User } from '../models/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';

@Injectable()
export class UserRepository extends Repository<User> {
  constructor(private dataSource: DataSource) {
    super(User, dataSource.createEntityManager());
  }

  async findAllUsers(): Promise<User[]> {
    return this.find();
  }

  async findUserById(id: number): Promise<User | null> {
    return this.findOneBy({ id });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.findOneBy({ email });
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return this.findOneBy({ username });
  }

  async findUsersByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<User[]> {
    return await this.find({
      where: [{ email: email }, { username: username }],
    });
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    const user = this.create(createUserDto);
    return this.save(user);
  }
}
