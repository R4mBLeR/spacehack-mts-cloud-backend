// corporation.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CorporationRepository } from '../repositories/corporation.repository';
import { Corporation } from '../models/corporation.entity';
import { CreateCorporationDto } from '../dto/create.corporation.dto';
import { CorporationResponseDto } from '../models/corporation.response.dto';
import { UserRepository } from '../repositories/user.repository';

@Injectable()
export class CorporationService {
  constructor(
    private readonly corporationRepository: CorporationRepository,
    private readonly userRepository: UserRepository,
  ) {}

  async create(
    userId: number,
    dto: CreateCorporationDto,
  ): Promise<CorporationResponseDto> {
    const corporation = this.corporationRepository.create({
      ...dto,
      adminId: userId,
    });

    const saved = await this.corporationRepository.save(corporation);
    await this.addMember(saved.id, userId, userId);

    return this.findOne(saved.id);
  }

  async findAll(): Promise<CorporationResponseDto[]> {
    const corps = await this.corporationRepository.find({
      relations: ['members'],
    });

    return corps.map((c) => new CorporationResponseDto(c));
  }

  async findOne(id: number): Promise<CorporationResponseDto> {
    const corporation = await this.corporationRepository.findOne({
      where: { id },
      relations: ['members'],
    });

    if (!corporation) {
      throw new NotFoundException('CORPORATION_NOT_FOUND');
    }

    return new CorporationResponseDto(corporation);
  }

  async remove(id: number, userId: number): Promise<void> {
    const corporation = await this.corporationRepository.findOne({
      where: { id },
    });

    if (!corporation) {
      throw new NotFoundException('CORPORATION_NOT_FOUND');
    }

    if (corporation.adminId !== userId) {
      throw new ForbiddenException('NO_ACCESS_TO_DELETE_CORPORATION');
    }

    await this.corporationRepository.delete(id);
  }

  async addMember(
    corporationId: number,
    userId: number,
    adminId: number,
  ): Promise<CorporationResponseDto> {
    // Проверяем существование корпорации
    const corporation = await this.corporationRepository.findOne({
      where: { id: corporationId },
    });

    if (!corporation) {
      throw new NotFoundException('CORPORATION_NOT_FOUND');
    }

    // Проверяем права администратора
    if (corporation.adminId !== adminId) {
      throw new ForbiddenException('ONLY_ADMINS_CAN_ADD_MEMBERS');
    }

    // Проверяем существование пользователя
    const user = await this.userRepository.findUserById(userId);

    if (!user) {
      throw new NotFoundException('USER_NOT_FOUND');
    }

    // Добавляем пользователя через relation builder
    await this.corporationRepository
      .createQueryBuilder()
      .relation(Corporation, 'members')
      .of(corporationId)
      .add(userId);

    return this.findOne(corporationId);
  }

  async removeMember(
    corporationId: number,
    adminId: number,
    userId: number,
  ): Promise<CorporationResponseDto> {
    // Проверяем существование корпорации
    const corporation = await this.corporationRepository.findOne({
      where: { id: corporationId },
    });

    if (!corporation) {
      throw new NotFoundException('CORPORATION_NOT_FOUND');
    }

    if (corporation.adminId !== adminId) {
      throw new ForbiddenException('ONLY_ADMINS_CAN_REMOVE_MEMBERS');
    }

    if (userId === adminId) {
      throw new ForbiddenException('CANNOT_REMOVE_ADMIN');
    }

    await this.corporationRepository
      .createQueryBuilder()
      .relation(Corporation, 'members')
      .of(corporationId)
      .remove(userId);

    return this.findOne(corporationId);
  }
}
