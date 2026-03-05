import { IsString, IsNotEmpty, IsInt, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SnapshotActionDto {
  @ApiProperty({ description: 'ID виртуальной машины (внутренний)', example: 1 })
  @IsInt()
  vmId: number;

  @ApiProperty({
    description: 'Имя снапшота',
    example: 'before-update',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9_-]+$/, { message: 'snapname must match [A-Za-z0-9_-]' })
  snapname: string;
}
