import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class UpdateRoleDto {
  /**
   * Привилегии через запятую.
   * @example "VM.Audit,VM.Console"
   */
  @IsString()
  @IsNotEmpty()
  privs: string;

  /**
   * Если true — привилегии добавляются к существующим, иначе заменяют.
   */
  @IsOptional()
  @IsBoolean()
  append?: boolean;
}
