import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({
    description: 'New user email address',
    example: 'john.doe@example.com',
    required: true,
    type: String,
    format: 'email',
  })
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'New user first name',
    example: 'John',
    minLength: 2,
    required: true,
  })
  @IsString()
  @MinLength(2)
  firstName?: string;

  @ApiProperty({
    description: 'New user last name',
    example: 'Doe',
    required: true,
    nullable: true,
  })
  @IsString()
  lastName?: string;

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
