import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePveUserDto {
  @ApiPropertyOptional({ description: 'Email', example: 'john@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: 'Имя' })
  @IsOptional()
  @IsString()
  firstname?: string;

  @ApiPropertyOptional({ description: 'Фамилия' })
  @IsOptional()
  @IsString()
  lastname?: string;

  @ApiPropertyOptional({ description: 'Группы через запятую' })
  @IsOptional()
  @IsString()
  groups?: string;

  @ApiPropertyOptional({ description: 'Комментарий' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ description: 'Активен ли пользователь' })
  @IsOptional()
  @IsBoolean()
  enable?: boolean;
}
