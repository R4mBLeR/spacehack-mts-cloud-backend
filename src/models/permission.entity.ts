import { Entity, Column, ManyToMany } from 'typeorm';
import { Role } from './role.entity';
import { BaseEntityWithId } from './base.entity';

@Entity('permissions')
export class Permission extends BaseEntityWithId {
  @Column({ unique: true })
  permission: string;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => Role, (role) => role.permissions) roles: Role[];
}
