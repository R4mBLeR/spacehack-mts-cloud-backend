import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsInt, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSnapshotDto {
  @ApiProperty({ description: 'ID виртуальной машины (внутренний)', example: 1 })
  @IsInt()
  vmId: number;

  @ApiProperty({
    description: 'Имя снапшота (латиница, цифры, дефис, подчёркивание)',
    example: 'before-update',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9_-]+$/, { message: 'snapname must match [A-Za-z0-9_-]' })
  snapname: string;

  @ApiPropertyOptional({ description: 'Описание снапшота' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Включить RAM-состояние', default: false })
  @IsOptional()
  @IsBoolean()
  vmstate?: boolean;
}
