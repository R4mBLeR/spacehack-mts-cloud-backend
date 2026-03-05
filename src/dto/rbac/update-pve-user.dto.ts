import { IsString, IsOptional, IsBoolean, IsEmail } from 'class-validator';

export class UpdatePveUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  firstname?: string;

  @IsOptional()
  @IsString()
  lastname?: string;

  /**
   * Группы через запятую.
   */
  @IsOptional()
  @IsString()
  groups?: string;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsBoolean()
  enable?: boolean;
}
