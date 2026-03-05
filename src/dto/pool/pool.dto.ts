import { IsString, IsNotEmpty, IsOptional, IsBoolean, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePoolDto {
  @ApiProperty({ example: 'corp_42', description: 'Идентификатор пула' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9_-]+$/, { message: 'poolid: only [A-Za-z0-9_-]' })
  poolid: string;

  @ApiPropertyOptional({ example: 'Ресурсы корпорации 42' })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdatePoolDto {
  /**
   * VMID'ы через запятую для добавления/удаления из пула.
   * @example "100,101,102"
   */
  @ApiPropertyOptional({ example: '100,101' })
  @IsOptional()
  @IsString()
  vms?: string;

  /**
   * Хранилища через запятую.
   * @example "local,local-lvm"
   */
  @ApiPropertyOptional({ example: 'local-lvm' })
  @IsOptional()
  @IsString()
  storage?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;

  /** Если true — удалить перечисленные ресурсы из пула (вместо добавления). */
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  delete?: boolean;
}
