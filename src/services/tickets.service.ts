import { Injectable, NotFoundException } from '@nestjs/common';
import { TicketRepository } from '../repositories/ticket.repository';
import { Ticket } from '../models/ticket.entity';
import { CreateTicketDto } from '../dto/create.ticket.dto';
import { ChangeVmStatusDto } from '../dto/change.vm.status.dto';

@Injectable()
export class TicketsService {
  constructor(private ticketRepository: TicketRepository) {}

  async findAll(): Promise<Ticket[]> {
    return await this.ticketRepository.findAllTickets();
  }

  async findOne(id: number): Promise<Ticket> {
    const ticket = await this.ticketRepository.findTicketById(id);
    if (!ticket) {
      throw new NotFoundException('TICKET_NOT_FOUND');
    }
    return ticket;
  }

  async findByUsername(id: number): Promise<Ticket[]> {
    const tickets = await this.ticketRepository.findTicketsByUserId(id);
    if (!tickets) {
      throw new NotFoundException('TICKETS_NOT_FOUND');
    }
    return tickets;
  }

  async create(
    createTicketDto: CreateTicketDto,
    userId: number,
  ): Promise<Ticket> {
    return this.ticketRepository.createTicket(createTicketDto, userId);
  }
}
