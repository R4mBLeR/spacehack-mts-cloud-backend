import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateRoleDto {
  @ApiProperty({
    description: 'Привилегии через запятую',
    example: 'VM.Audit,VM.Console',
  })
  @IsString()
  @IsNotEmpty()
  privs: string;

  @ApiPropertyOptional({
    description: 'Если true — привилегии добавляются к существующим, иначе заменяют',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  append?: boolean;
}
