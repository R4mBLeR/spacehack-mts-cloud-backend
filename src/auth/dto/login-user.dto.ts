// dto/create-user.dto.ts
import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({
    description: 'Unique username for the user',
    example: 'johndoe123',
    minLength: 3,
    required: true,
  })
  @IsString()
  @MinLength(8)
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
}
