import {
  Entity,
  Column,
  BeforeInsert,
  BeforeUpdate,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
  AfterLoad,
} from 'typeorm';
import { AuthUtils } from '../utils/auth.utils';
import { Exclude } from 'class-transformer';
import { Role } from './role.entity';
import { BaseEntityWithId } from './base.entity';
import { Corporation } from './corporation.entity';

@Entity({ schema: 'users', name: 'users' })
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

  @Column({ default: 0, type: 'money' })
  balance: number;

  @CreateDateColumn()
  created_at: string;

  @Exclude()
  private originalPassword: string;

  @BeforeInsert()
  async hashPasswordBeforeInsert(): Promise<void> {
    if (this.password) {
      const bcryptService = new AuthUtils();
      this.password = await bcryptService.hashPassword(this.password);
    }
  }

  @BeforeUpdate()
  async hashPasswordBeforeUpdate(): Promise<void> {
    if (this.password && this.password !== this.originalPassword) {
      const bcryptService = new AuthUtils();
      this.password = await bcryptService.hashPassword(this.password);
    }
  }

  @AfterLoad()
  afterLoad() {
    this.originalPassword = this.password;
  }

  @ManyToMany(() => Role, { eager: true })
  @JoinTable({
    name: 'user_roles',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'role_id', referencedColumnName: 'id' },
  })
  roles: Role[];

  @ManyToMany(() => Corporation, (corp) => corp.members)
  corporations: Corporation[];
}
