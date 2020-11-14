import { IsDefined, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * An alias record
 */
export abstract class Alias {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The e-mail address of the alias',
    example: 'alias1.example@example.com',
  })
  address: string;
}
