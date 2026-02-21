import { Entity, Column, PrimaryColumn } from 'typeorm';

@Entity('sessions')
export class Session {
  @PrimaryColumn()
  user_id: number;

  @Column()
  refresh_token: string;
}
