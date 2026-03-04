import { IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ExecCommandDto {
  @ApiProperty({ example: 101 })
  @IsInt()
  id: number;

  @ApiProperty({ example: 'ls' })
  command: string;

  @ApiProperty({ example: ['-la', '/'], required: false })
  args?: string[];
}
