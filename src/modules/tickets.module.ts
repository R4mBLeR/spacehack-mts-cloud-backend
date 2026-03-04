import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { AuthUtils } from '../utils/auth.utils';
import { TicketsService } from '../services/tickets.service';
import { TicketRepository } from '../repositories/ticket.repository';
import { TicketController } from '../controllers/tickets.controller';
import { Ticket } from '../models/ticket.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Ticket])],
  controllers: [TicketController],
  providers: [TicketsService, TicketRepository, JwtService, AuthUtils],
  exports: [TicketsService, TicketRepository],
})
export class TicketsModule {}
