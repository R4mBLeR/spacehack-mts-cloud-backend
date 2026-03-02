// models/vm.configuration.ts
import { IsInt, Min, Max } from 'class-validator'; // <-- Добавляем декораторы

export class VmConfiguration {
  @IsInt()
  @Min(1)
  @Max(32)
  cpu: number;

  @IsInt()
  @Min(1)
  @Max(128)
  ram: number;

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
