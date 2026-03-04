import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
} from '@nestjs/common';
import { RolesGuard } from '../auth/guards/roles.guard';
import { HasRoles } from '../auth/decorators/role.decorator';
import { Roles } from '../auth/roles';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/decorators/current.user.decorator.dto';
import { TicketsService } from '../services/tickets.service';
import { CreateTicketDto } from '../dto/create.ticket.dto';
import { Ticket } from '../models/ticket.entity';

@Controller('tickets')
@UseInterceptors(ClassSerializerInterceptor)
export class TicketController {
  constructor(private readonly ticketsService: TicketsService) {}

  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  @Post()
  async create(
    @CurrentUserId() userId: number,
    @Body() createTicketDto: CreateTicketDto,
  ): Promise<CreateTicketDto> {
    return this.ticketsService.create(createTicketDto, userId);
  }

  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.ADMIN)
  @Get()
  async findAll(): Promise<Ticket[]> {
    return this.ticketsService.findAll();
  }

  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Ticket> {
    return this.ticketsService.findOne(+id);
  }
}
