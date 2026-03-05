import { IsString, IsNotEmpty, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({
    description: 'Уникальный идентификатор роли (латиница, цифры, дефис, подчёркивание)',
    example: 'TenantAdmin',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9_-]+$/, { message: 'roleid must contain only [A-Za-z0-9_-]' })
  roleid: string;

  @ApiProperty({
    description: 'Привилегии через запятую',
    example: 'VM.Audit,VM.Console,VM.PowerMgmt',
  })
  @IsString()
  @IsNotEmpty()
  privs: string;
}
