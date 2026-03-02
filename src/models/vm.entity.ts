import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntityWithId } from './base.entity';
import { User } from './user.entity';

export enum VmStatus {
  CREATING = 0,
  RUNNING = 1,
  STOPPED = 2,
  ERROR = 3,
}

@Entity({ schema: 'servers', name: 'virtual_machines' })
export class VirtualMachine extends BaseEntityWithId {
  @Column({ nullable: true })
  proxmox_id: number;

  @Column()
  name: string;

  @Column()
  user_id: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({
    name: 'status',
    type: 'enum',
    enum: VmStatus,
    default: VmStatus.CREATING,
  })
  status: VmStatus;
}
