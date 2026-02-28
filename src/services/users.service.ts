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

@Injectable()
export class UsersService {
  constructor(
    private userRepository: UserRepository,
    private authUtils: AuthUtils,
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
    const existingUser = await this.userRepository.find({
      where: [
        { email: createUserDto.email },
        { username: createUserDto.username },
      ],
    });
    if (existingUser.length > 0) {
      throw new ConflictException('CURRENT_EMAIL_OR_USERNAME_ALREADY_EXISTS');
    }
    return this.userRepository.createUser(createUserDto);
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const existingUser = await this.userRepository.findOne({ where: { id } });

    if (!existingUser) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    const { password, ...userDataWithoutPassword } = updateUserDto;

    const fieldsToUpdate = Object.entries(userDataWithoutPassword).filter(
      ([_, value]) => value !== undefined,
    );

    const isValidPassword = await this.authUtils.comparePasswords(
      updateUserDto.password,
      existingUser.password,
    );

    if (!isValidPassword) {
      throw new UnauthorizedException('PASSWORD_IS_INCORRECT');
    }
    if (fieldsToUpdate.length === 0 && !password) {
      throw new BadRequestException('NO_FIELDS_TO_UPDATE');
    }

    fieldsToUpdate.forEach(([key, value]) => {
      (existingUser as any)[key] = value;
    });

    const isEmailTaken = await this.userRepository.findOne({
      where: { email: existingUser.email },
    });

    if (isEmailTaken) {
      throw new ConflictException('EMAIL_IS_ALREADY_USED');
    }

    return this.userRepository.save(existingUser);
  }
}
