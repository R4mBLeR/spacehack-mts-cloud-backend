// src/console/entities/console-session.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum ConsoleSessionStatus {
  CONNECTING = 'connecting',
  ACTIVE = 'active',
  DISCONNECTED = 'disconnected',
  ERROR = 'error',
}

@Entity({ schema: 'servers', name: 'console_sessions' })
export class ConsoleSessionEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column()
  @Index()
  clientId: string; // Socket.IO client ID

  @Column()
  @Index()
  vmId: number; // Внутренний ID VM из вашей таблицы

  @Column({ type: 'enum', enum: ['qemu', 'lxc'] })
  type: 'qemu' | 'lxc';

  @Column({ default: 'pve' })
  node: string;

  @Column({ type: 'int', nullable: true })
  proxmoxVmid: number; // Proxmox VM ID

  @Column({
    type: 'enum',
    enum: ConsoleSessionStatus,
    default: ConsoleSessionStatus.CONNECTING,
  })
  status: ConsoleSessionStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ticket: string;

  @Column({ type: 'int', nullable: true })
  port: number;

  @Column({ type: 'text', nullable: true })
  errorMessage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  disconnectedAt: Date;

  @Column({ type: 'bigint', default: 0 })
  bytesReceived: number;

  @Column({ type: 'bigint', default: 0 })
  bytesSent: number;
}
