import { ApiProperty } from '@nestjs/swagger';

export class ChangeVmStatusDto {
  @ApiProperty({
    description: 'VPS id',
    example: 1,
    required: true,
  })
  id: number;
}
