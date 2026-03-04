import { IsString, MinLength, Allow, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VmConfiguration } from '../models/vm.configuration';

const exampleConf = new VmConfiguration(2, 8, 16);

export class UpdateVmDto {
  @ApiProperty({
    description: 'New name for VM',
    example: 1,
    required: true,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'New VM Configuration',
    example: exampleConf,
    required: true,
  })
  @Allow() // <-- Добавляем Allow сюда
  configuration: VmConfiguration;
}
