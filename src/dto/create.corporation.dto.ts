import { IsString, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCorporationDto {
  @ApiProperty({
    description: 'Corporation name',
    example: 'best corporation name',
    minLength: 3,
    required: true,
  })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({
    description: 'Corp description',
    example: 'test description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;
}
