import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEmail, Matches } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePveUserDto {
  @ApiProperty({
    description: 'Идентификатор пользователя в формате user@realm',
    example: 'john@pve',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9._-]+@[A-Za-z0-9._-]+$/, {
    message: 'userid must be in format user@realm',
  })
  userid: string;

  @ApiPropertyOptional({ description: 'Пароль' })
  @IsOptional()
  @IsString()
  password?: string;

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

  @ApiPropertyOptional({ description: 'Группы через запятую', example: 'admins,users' })
  @IsOptional()
  @IsString()
  groups?: string;

  @ApiPropertyOptional({ description: 'Комментарий' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ description: 'Активен ли пользователь', default: true })
  @IsOptional()
  @IsBoolean()
  enable?: boolean;
}
