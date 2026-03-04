import { ApiProperty } from '@nestjs/swagger';
import { IsInt } from 'class-validator';

export class ChangeVmStatusDto {
  @ApiProperty({
    description: 'VPS id',
    example: 1,
    required: true,
  })
  @IsInt()
  id: number;
}
