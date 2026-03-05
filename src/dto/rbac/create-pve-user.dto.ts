import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsEmail, Matches } from 'class-validator';

export class CreatePveUserDto {
  /**
   * Идентификатор пользователя в формате "user@realm".
   * @example "john@pve"
   */
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9._-]+@[A-Za-z0-9._-]+$/, {
    message: 'userid must be in format user@realm',
  })
  userid: string;

  @IsOptional()
  @IsString()
  password?: string;

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
   * @example "admins,users"
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
