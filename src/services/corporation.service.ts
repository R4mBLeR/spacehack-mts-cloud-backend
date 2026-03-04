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

@Injectable()
export class CorporationService {
  constructor(private readonly corporationRepository: CorporationRepository) {}

  async create(
    userId: number,
    dto: CreateCorporationDto,
  ): Promise<CorporationResponseDto> {
    const corporation = this.corporationRepository.create({
      ...dto,
      adminId: userId,
    });

    const saved = await this.corporationRepository.save(corporation);
    await this.addMember(saved.id, userId);

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
      throw new NotFoundException('Corporation not found');
    }

    return new CorporationResponseDto(corporation);
  }

  async remove(id: number, userId: number): Promise<void> {
    const corporation = await this.corporationRepository.findOne({
      where: { id },
    });

    if (!corporation) {
      throw new NotFoundException('Corporation not found');
    }

    if (corporation.adminId !== userId) {
      throw new ForbiddenException('Only admin can delete corporation');
    }

    await this.corporationRepository.delete(id);
  }

  async addMember(
    corporationId: number,
    userId: number,
  ): Promise<CorporationResponseDto> {
    const corporation = await this.corporationRepository.findOne({
      where: { id: corporationId },
      relations: ['members'],
    });

    if (!corporation) {
      throw new NotFoundException('Corporation not found');
    }

    const isMember = corporation.members.some((m: any) => m.id === userId);
    if (isMember) {
      throw new ForbiddenException('User already member');
    }

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
    const corporation = await this.corporationRepository.findOne({
      where: { id: corporationId },
    });

    if (!corporation) {
      throw new NotFoundException('Corporation not found');
    }

    if (corporation.adminId !== adminId) {
      throw new ForbiddenException('Only admin can remove members');
    }

    if (userId === adminId) {
      throw new ForbiddenException('Cannot remove admin');
    }

    await this.corporationRepository
      .createQueryBuilder()
      .relation(Corporation, 'members')
      .of(corporationId)
      .remove(userId);

    return this.findOne(corporationId);
  }
}
