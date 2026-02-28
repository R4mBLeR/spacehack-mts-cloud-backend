import {
  Entity,
  Column,
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { AuthUtils } from '../utils/auth.utils';
import { Exclude } from 'class-transformer';
import { Role } from './role.entity';
import { BaseEntityWithId } from './base.entity';

@Entity('users')
export class User extends BaseEntityWithId {
  @Column({ unique: true })
  email: string;

  @Column({ unique: true })
  username: string;

  @Column()
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true })
  surName: string;

  @Column()
  phoneNumber: string;

  @Column()
  @Exclude()
  password: string;

  @CreateDateColumn()
  created_at: string;

  @BeforeInsert()
  async hashPassword(): Promise<void> {
    if (this.password) {
      const bcryptService = new AuthUtils();
      this.password = await bcryptService.hashPassword(this.password);
    }
  }

  @ManyToMany(() => Role, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];
}
