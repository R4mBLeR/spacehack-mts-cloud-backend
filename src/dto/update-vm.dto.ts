import { IsString, MinLength, Allow } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VmConfiguration } from '../models/vm.configuration';

const exampleConf = new VmConfiguration(2, 8, 16);

export class UpdateVmDto {
  @ApiProperty({
    description: 'New name for VM',
    example: 'best vm',
    minLength: 3,
    required: true,
  })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({
    description: 'New VM Configuration',
    example: exampleConf,
    required: true,
  })
  @Allow() // <-- Добавляем Allow сюда
  configuration: VmConfiguration;
}
