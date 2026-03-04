import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTicketDto {
  @ApiProperty({
    description: 'Ticket name',
    example: 'create vm error',
    minLength: 3,
    required: true,
  })
  @IsString()
  @MinLength(3)
  name: string;

  @ApiProperty({
    description: 'Problem description',
    example: 'test description',
    required: true,
  })
  description: string;
}
