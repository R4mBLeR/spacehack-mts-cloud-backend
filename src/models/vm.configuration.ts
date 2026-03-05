// models/vm.configuration.ts
import { IsInt, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VmConfiguration {
  @ApiProperty({ description: 'Кол-во vCPU', example: 2, minimum: 1, maximum: 32 })
  @IsInt()
  @Min(1)
  @Max(32)
  cpu: number;

  @ApiProperty({ description: 'RAM (MB)', example: 8, minimum: 1, maximum: 128 })
  @IsInt()
  @Min(1)
  @Max(128)
  ram: number;

  @ApiProperty({ description: 'Диск SSD (MB)', example: 16, minimum: 10, maximum: 1000 })
  @IsInt()
  @Min(10)
  @Max(1000)
  ssd: number;

  constructor(cpu: number, ram: number, ssd: number) {
    this.cpu = cpu;
    this.ram = ram;
    this.ssd = ssd;
  }
}
