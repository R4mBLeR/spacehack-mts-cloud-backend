import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAclDto {
  @ApiProperty({ description: 'Путь ресурса Proxmox', example: '/vms/100' })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiProperty({ description: 'Роль(и) через запятую', example: 'TenantAdmin' })
  @IsString()
  @IsNotEmpty()
  roles: string;

  @ApiPropertyOptional({ description: 'Пользователь(и) "user@realm" через запятую', example: 'john@pve' })
  @IsOptional()
  @IsString()
  users?: string;

  @ApiPropertyOptional({ description: 'Группа(ы) через запятую' })
  @IsOptional()
  @IsString()
  groups?: string;

  @ApiPropertyOptional({ description: 'Распространять ли права вниз по дереву ресурсов', default: true })
  @IsOptional()
  @IsBoolean()
  propagate?: boolean;

  @ApiPropertyOptional({ description: 'Удалить указанную ACL-запись вместо добавления', default: false })
  @IsOptional()
  @IsBoolean()
  delete?: boolean;
}
