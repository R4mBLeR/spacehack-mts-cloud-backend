import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { BaseEntityWithId } from './base.entity';

@Entity({ schema: 'users', name: 'sessions' })
export class Session extends BaseEntityWithId {
  @Column()
  refresh_token: string;

  @Column()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;
}
