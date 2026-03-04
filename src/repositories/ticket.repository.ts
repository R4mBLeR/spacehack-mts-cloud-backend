import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { Ticket } from '../models/ticket.entity';
import { CreateTicketDto } from '../dto/create.ticket.dto';

@Injectable()
export class TicketRepository {
  constructor(
    @InjectRepository(Ticket)
    private readonly repository: Repository<Ticket>,
  ) {}

  async findAllTickets(): Promise<Ticket[]> {
    return this.repository.find();
  }

  async findTicketById(id: number): Promise<Ticket | null> {
    return this.repository.findOneBy({ user_id: id });
  }

  async findTicketsByUserId(id: number): Promise<Ticket[] | null> {
    return this.repository.findBy({ user_id: id });
  }

  async deleteTicket(id: number): Promise<DeleteResult> {
    return this.repository.delete({ id });
  }

  async createTicket(
    createTicketDto: CreateTicketDto,
    userId: number,
  ): Promise<Ticket> {
    const ticket = this.repository.create(createTicketDto);
    ticket.user_id = userId;
    return this.repository.save(ticket);
  }

  async deleteTicketById(id: number): Promise<DeleteResult> {
    return await this.repository.delete({
      id: id,
    });
  }
}
