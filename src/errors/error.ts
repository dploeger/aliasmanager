import { IsDefined, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export abstract class Error {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Error message',
    example: 'Alias alias1.example@example.com already exists',
  })
  message: string;
}
