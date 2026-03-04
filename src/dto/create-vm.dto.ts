import { IsString, MinLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { VmConfiguration } from '../models/vm.configuration';

export class CreateVmDto {
  @ApiProperty({
    description: 'Name for VM',
    example: 'best-VM',
    minLength: 3,
  })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({
    description: 'Configuration',
    example: { cpu: 1, ram: 16, ssd: 1 },
  })
  @ValidateNested()
  @Type(() => VmConfiguration)
  configuration: VmConfiguration;
}
