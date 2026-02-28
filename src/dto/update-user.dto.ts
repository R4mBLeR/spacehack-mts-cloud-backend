import { IsEmail, IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
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
    description: 'password',
    example: '123456789',
    minLength: 8,
    required: true,
  })
  @IsString()
  @MinLength(2)
  password: string;

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
