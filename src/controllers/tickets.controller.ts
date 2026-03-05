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
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUserId } from '../auth/decorators/current.user.decorator.dto';
import { TicketsService } from '../services/tickets.service';
import { CreateTicketDto } from '../dto/create.ticket.dto';
import { Ticket } from '../models/ticket.entity';

@ApiTags('Tickets')
@Controller('tickets')
@UseInterceptors(ClassSerializerInterceptor)
export class TicketController {
  constructor(private readonly ticketsService: TicketsService) {}

  @Post()
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  @ApiOperation({ summary: 'Создать тикет поддержки' })
  @ApiResponse({ status: 201, description: 'Тикет создан' })
  @ApiResponse({ status: 400, description: 'Валидация не пройдена' })
  async create(
    @CurrentUserId() userId: number,
    @Body() createTicketDto: CreateTicketDto,
  ): Promise<CreateTicketDto> {
    return this.ticketsService.create(createTicketDto, userId);
  }

  @Get()
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.ADMIN)
  @ApiOperation({ summary: 'Список всех тикетов (admin)' })
  async findAll(): Promise<Ticket[]> {
    return this.ticketsService.findAll();
  }

  @Get(':id')
  @ApiBearerAuth('access-token')
  @UseGuards(RolesGuard)
  @HasRoles(Roles.USER)
  @ApiOperation({ summary: 'Получить тикет по ID' })
  @ApiParam({ name: 'id', type: Number, description: 'ID тикета', example: 1 })
  @ApiResponse({ status: 200, description: 'Тикет найден' })
  @ApiResponse({ status: 404, description: 'Тикет не найден' })
  async findOne(@Param('id') id: number): Promise<Ticket> {
    return this.ticketsService.findOne(+id);
  }
}
