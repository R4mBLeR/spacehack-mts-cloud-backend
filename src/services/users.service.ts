import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { User } from '../models/user.entity';
import { CreateUserDto } from '../dto/create-user.dto';
import { UserRepository } from '../repositories/user.repository';
import { UpdateUserDto } from '../dto/update-user.dto';
import { AuthUtils } from '../utils/auth.utils';
import { Role } from '../models/role.entity';
import { Session } from '../models/session.entity';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, In } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    private userRepository: UserRepository,
    private authUtils: AuthUtils,
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {}

  async findAll(): Promise<User[]> {
    return this.userRepository.findAllUsers();
  }

  async findOne(id: number): Promise<User> {
    const user = await this.userRepository.findUserById(id);
    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }
    return user;
  }

  async findByEmail(email: string): Promise<User> {
    const user = await this.userRepository.findUserByEmail(email);
    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }
    return user;
  }

  async findByUsername(username: string): Promise<User> {
    const user = await this.userRepository.findUserByUsername(username);
    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }
    return user;
  }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUsers = await this.userRepository.findUsersByEmailOrUsername(
      createUserDto.email,
      createUserDto.username,
    );

    if (existingUsers.length > 0) {
      throw new ConflictException('CURRENT_EMAIL_OR_USERNAME_ALREADY_EXISTS');
    }
    const validChars = '+1234567890';

    for (let i = 0; i < createUserDto.phoneNumber.length; i++) {
      if (!validChars.includes(createUserDto.phoneNumber[i])) {
        throw new BadRequestException('PHONE_NUMBER_IS_INCORRECT');
      }
    }

    const defaultRole = await this.dataSource
      .getRepository(Role)
      .findOne({ where: { role: 'user' } });

    if (!defaultRole) {
      throw new NotFoundException('DEFAULT_ROLE_NOT_FOUND');
    }

    return this.userRepository.createUser({
      ...createUserDto,
      roles: [defaultRole],
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findUserById(id);
    if (!existingUser) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    const { password, ...otherData } = updateUserDto;

    if (!password) {
      throw new BadRequestException('PASSWORD_REQUIRED');
    }

    const isValidPassword = await this.authUtils.comparePasswords(
      password,
      existingUser.password,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('PASSWORD_INCORRECT');
    }

    const { email, ...restData } = otherData;

    if (email && email !== existingUser.email) {
      const userWithSameEmail =
        await this.userRepository.findUserByEmail(email);
      if (userWithSameEmail) {
        throw new ConflictException('EMAIL_ALREADY_USED');
      }
      existingUser.email = email;
    }

    const changedFields = Object.keys(restData).filter(
      (key) =>
        restData[key] !== undefined && existingUser[key] !== restData[key],
    );

    if (!changedFields.length && !email) {
      throw new BadRequestException('NO_DATA_TO_UPDATE');
    }

    changedFields.forEach((key) => {
      existingUser[key] = restData[key];
    });

    return this.userRepository.save(existingUser);
  }

  async assignRoles(userId: number, roleNames: string[]): Promise<User> {
    const user = await this.userRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    const roles = await this.dataSource
      .getRepository(Role)
      .findBy({ role: In(roleNames) });

    const foundNames = roles.map((r) => r.role);
    const missing = roleNames.filter((n) => !foundNames.includes(n));
    if (missing.length > 0) {
      throw new NotFoundException(`Roles not found: ${missing.join(', ')}`);
    }

    user.roles = roles;
    const updatedUser = await this.userRepository.save(user);

    // Инвалидируем все сессии пользователя —
    // при следующем refresh он получит новый токен с актуальными ролями
    await this.dataSource
      .getRepository(Session)
      .delete({ user_id: userId });

    return updatedUser;
  }
}
