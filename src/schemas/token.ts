import { IsDefined, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * The token model
 */
export abstract class Token {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    example: 'someverylongencryptedstring',
    description: 'The signed JWT token',
  })
  token: string;
}
