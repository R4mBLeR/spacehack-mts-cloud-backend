import { Entity, Column, ManyToMany, JoinTable } from 'typeorm';
import { Permission } from './permission.entity';
import { BaseEntityWithId } from './base.entity';

@Entity('roles')
export class Role extends BaseEntityWithId {
  @Column({ unique: true })
  role: string;

  @Column({ nullable: true })
  description: string;

  @ManyToMany(() => Permission, (permission) => permission.roles, {
    cascade: true,
  })
  @JoinTable({
    name: 'role_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];
}
