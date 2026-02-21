// dto/create-user.dto.ts
import { IsEmail, IsString, MinLength } from 'class-validator';

export class CompleteRegisterUserDto {
  @IsEmail()
  code: number;

  @IsString()
  @MinLength(3)
  username: string;
}
