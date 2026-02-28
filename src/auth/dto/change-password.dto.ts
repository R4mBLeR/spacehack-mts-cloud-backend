import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({
    description: 'Password must be at least 8 characters',
    example: '12345678',
    required: true,
    type: String,
    format: 'password',
  })
  @IsString()
  @MinLength(8)
  oldPassword: string;

  @ApiProperty({
    description: 'Password must be at least 8 characters',
    example: '87654321',
    required: true,
    type: String,
    format: 'password',
  })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
