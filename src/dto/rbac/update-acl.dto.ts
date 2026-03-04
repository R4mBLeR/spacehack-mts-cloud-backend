import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class UpdateAclDto {
  /**
   * Путь ресурса Proxmox.
   * @example "/vms/100"
   */
  @IsString()
  @IsNotEmpty()
  path: string;

  /**
   * Роль(и) через запятую.
   * @example "TenantAdmin"
   */
  @IsString()
  @IsNotEmpty()
  roles: string;

  /**
   * Пользователь(и) "user@realm" через запятую.
   * @example "john@pve"
   */
  @IsOptional()
  @IsString()
  users?: string;

  /**
   * Группа(ы) через запятую.
   */
  @IsOptional()
  @IsString()
  groups?: string;

  /**
   * Распространять ли права вниз по дереву ресурсов.
   */
  @IsOptional()
  @IsBoolean()
  propagate?: boolean;

  /**
   * Удалить указанную ACL-запись вместо добавления.
   */
  @IsOptional()
  @IsBoolean()
  delete?: boolean;
}
