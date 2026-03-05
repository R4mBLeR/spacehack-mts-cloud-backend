import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { User } from '../models/user.entity';

export class UpdateUserDto {
  @ApiProperty({
    description: 'New user email address',
    example: 'john.doe@example.com',
    type: String,
    format: 'email',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    description: 'Новый пароль (если нужна смена)',
    example: '123456789',
    type: String,
    minLength: 8,
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiProperty({
    description: 'New user first name',
    example: 'John',
    minLength: 2,
  })
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @ApiProperty({
    description: 'New user last name',
    example: 'Doe',
  })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({
    description: 'User surname',
    example: 'Nikolayevich',
  })
  @IsOptional()
  @IsString()
  surName?: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+123456789',
  })
  @IsString()
  @IsOptional()
  phoneNumber?: string;
}
