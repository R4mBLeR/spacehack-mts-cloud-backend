import { IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { VmConfiguration } from '../models/vm.configuration';

const exampleConf = new VmConfiguration(2, 8, 16);

export class UpdateVmDto {
  @ApiProperty({
    description: 'ID виртуальной машины (внутренний)',
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
  @ValidateNested()
  @Type(() => VmConfiguration)
  configuration: VmConfiguration;
}
