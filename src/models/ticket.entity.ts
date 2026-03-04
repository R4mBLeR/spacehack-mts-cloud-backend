import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntityWithId } from './base.entity';
import { User } from './user.entity';

@Entity({ schema: 'users', name: 'tickets' })
export class Ticket extends BaseEntityWithId {
  @Column()
  user_id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
