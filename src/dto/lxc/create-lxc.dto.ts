import {
  IsString, IsNotEmpty, IsOptional, IsInt, IsBoolean,
  Min, Max, Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateLxcDto {
  @ApiProperty({ example: 'my-container', description: 'Hostname контейнера' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9_-]+$/, { message: 'hostname: only [A-Za-z0-9_-]' })
  hostname: string;

  @ApiPropertyOptional({ example: 'local:vztmpl/debian-12-standard_12.2-1_amd64.tar.zst' })
  @IsOptional()
  @IsString()
  ostemplate?: string;

  /** RAM в MB (64–65536) */
  @ApiPropertyOptional({ example: 512 })
  @IsOptional()
  @IsInt()
  @Min(64)
  @Max(65536)
  memory?: number;

  /** Число vCPU (1–32) */
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(32)
  cores?: number;

  /**
   * Корневой диск, напр. "local-lvm:8" (хранилище:размер GB).
   */
  @ApiPropertyOptional({ example: 'local-lvm:8' })
  @IsOptional()
  @IsString()
  rootfs?: string;

  @ApiPropertyOptional({ description: 'Пароль root' })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiPropertyOptional({ description: 'SSH public key' })
  @IsOptional()
  @IsString()
  sshPublicKeys?: string;

  /**
   * Сетевой интерфейс, напр. "name=eth0,bridge=vnet10,ip=dhcp".
   */
  @ApiPropertyOptional({ example: 'name=eth0,bridge=vnet10,ip=dhcp' })
  @IsOptional()
  @IsString()
  net0?: string;

  @ApiPropertyOptional({ description: 'Непривилегированный контейнер', default: true })
  @IsOptional()
  @IsBoolean()
  unprivileged?: boolean;

  @ApiPropertyOptional({ description: 'Запустить сразу после создания', default: false })
  @IsOptional()
  @IsBoolean()
  start?: boolean;
}
