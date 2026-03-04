import { IsString, MinLength, Allow } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { VmConfiguration } from '../models/vm.configuration';

export class CreateVmDto {
  @ApiProperty({
    description: 'Name for VM',
    example: 'best VM',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({
    description: 'Configuration',
    example: { cpu: 1, ram: 1, ssd: 1 },
  })
  @Allow()
  configuration: VmConfiguration;
}
