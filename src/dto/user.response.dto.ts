import { Exclude, Expose } from 'class-transformer';

@Exclude() // Всё скрыто по умолчанию
export class UserResponseDto {
  @Expose() id: number;
  @Expose() email: string;
  @Expose() username: string;
  @Expose() firstName: string;
  @Expose() lastName: string;
  @Expose() surName: string;
  @Expose() phoneNumber: string;
  @Expose() balance: number;
  @Expose() roles: any[];
  // password и originalPassword НЕ помечены @Expose — скрыты
}
