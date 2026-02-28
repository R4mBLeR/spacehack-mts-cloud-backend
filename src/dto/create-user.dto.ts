import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Unique username for the user',
    example: 'johndoe123',
    minLength: 3,
    required: true,
  })
  @IsString()
  @MinLength(3)
  username: string;

  @ApiProperty({
    description: 'Password must be at least 8 characters',
    example: '12345678',
    required: true,
    type: String,
    format: 'password',
  })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@example.com',
    required: true,
    type: String,
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    minLength: 2,
    required: true,
  })
  @IsString()
  @MinLength(2)
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    required: true,
    nullable: true,
  })
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'User surname',
    example: 'Nikolayevich',
    required: false,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  surName?: string;

  @ApiProperty({
    description: 'User phone number',
    example: '+123456789',
    required: true,
  })
  @IsString()
  phoneNumber: string;
}
