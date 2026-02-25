import { PrimaryGeneratedColumn, BaseEntity } from 'typeorm';

export abstract class BaseEntityWithId extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;
}
