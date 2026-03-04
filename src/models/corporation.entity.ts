import {
  Entity,
  Column,
  ManyToMany,
  JoinTable,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { BaseEntityWithId } from './base.entity';
import { Exclude } from 'class-transformer';

@Entity({ schema: 'corporations', name: 'corporations' })
export class Corporation extends BaseEntityWithId {
  @Column({ unique: false })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Exclude()
  @ManyToOne(() => User, { nullable: false, lazy: true })
  @JoinColumn({ name: 'admin_id' })
  admin: User;

  @Column({ name: 'admin_id' })
  adminId: number; // или number, в зависимости от типа ID

  @ManyToMany(() => User, (user) => user.corporations) // нужно добавить в User
  @JoinTable({
    name: 'corporation_members', // имя промежуточной таблицы
    schema: 'corporations',
    joinColumn: { name: 'corporation_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  members: User[];
}
