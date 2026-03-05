// src/console/dto/connect-console.dto.ts
import {
  IsNumber,
  IsOptional,
  IsEnum,
  IsString,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum ConsoleType {
  QEMU = 'qemu',
  LXC = 'lxc',
}

export class ConnectConsoleDto {
  @ApiProperty({
    description: 'ID виртуальной машины в системе',
    example: 100,
    type: Number,
  })
  @IsNumber()
  vmId: number;

  @ApiPropertyOptional({
    description: 'Тип виртуализации',
    enum: ConsoleType,
    example: ConsoleType.QEMU,
    default: ConsoleType.QEMU,
  })
  @IsOptional()
  @IsEnum(ConsoleType)
  type?: ConsoleType = ConsoleType.QEMU;

  @ApiPropertyOptional({
    description: 'Имя ноды Proxmox',
    example: 'pve',
    default: 'pve',
  })
  @IsOptional()
  @IsString()
  node?: string = 'pve';
}

export class ConsoleMessageDto {
  @ApiProperty({
    description: 'Данные для отправки в консоль (текст или команда)',
    example: 'ls -la\n',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  data: string;
}

export class ConsoleResizeDto {
  @ApiProperty({
    description: 'Количество колонок (ширина терминала)',
    example: 80,
    type: Number,
  })
  @IsNumber()
  cols: number;

  @ApiProperty({
    description: 'Количество строк (высота терминала)',
    example: 24,
    type: Number,
  })
  @IsNumber()
  rows: number;
}

// Дополнительные DTO для ответов

export class ConsoleConnectResponseDto {
  @ApiProperty({
    description: 'ID созданной сессии',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  sessionId: string;

  @ApiProperty({
    description: 'WebSocket URL для подключения',
    example: '/console/ws/550e8400-e29b-41d4-a716-446655440000',
  })
  wsUrl: string;

  @ApiProperty({
    description: 'Статус создания сессии',
    example: 'created',
  })
  status: string;
}

export class ConsoleSessionDto {
  @ApiProperty({
    description: 'ID сессии',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'ID виртуальной машины',
    example: 100,
  })
  vmId: number;

  @ApiProperty({
    description: 'Тип виртуализации',
    enum: ['qemu', 'lxc'],
    example: 'qemu',
  })
  type: string;

  @ApiProperty({
    description: 'Статус сессии',
    enum: ['connecting', 'active', 'disconnected', 'error'],
    example: 'active',
  })
  status: string;

  @ApiProperty({
    description: 'Активна ли сессия',
    example: true,
  })
  active: boolean;

  @ApiProperty({
    description: 'Размер буфера вывода (для HTTP сессий)',
    example: 42,
  })
  bufferSize: number;

  @ApiProperty({
    description: 'Дата создания',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;
}

export class ConsoleOutputDto {
  @ApiProperty({
    description: 'Массив строк вывода из консоли',
    example: [
      'root@vm:~# ls -la\n',
      'total 128\n',
      'drwxr-xr-x  5 root root  4096 Jan 15 10:00 .\n',
    ],
    type: [String],
  })
  output: string[];
}

export class ConsoleStatsDto {
  @ApiProperty({
    description: 'Количество HTTP сессий',
    example: 5,
  })
  httpSessions: number;

  @ApiProperty({
    description: 'Количество WebSocket сессий',
    example: 3,
  })
  wsSessions: number;

  @ApiProperty({
    description: 'Общее количество активных сессий',
    example: 8,
  })
  totalActive: number;
}

export class ConsoleErrorDto {
  @ApiProperty({
    description: 'Сообщение об ошибке',
    example: 'VM_NOT_FOUND',
  })
  message: string;

  @ApiProperty({
    description: 'Код ошибки',
    example: 'UNKNOWN_ERROR',
    required: false,
  })
  code?: string;
}
