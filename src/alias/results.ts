import { IsArray, IsDefined, IsNotEmpty, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export abstract class Results<T> {
  @IsDefined()
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The current page of the results',
    example: 1,
  })
  page: number;
  @IsDefined()
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The number of results per page',
    example: 1,
  })
  pageSize: number;
  @IsDefined()
  @IsNumber()
  @IsNotEmpty()
  @ApiProperty({
    description: 'The total number of results',
    example: 1,
  })
  total: number;
  @IsDefined()
  @IsArray()
  @ApiProperty({
    description: 'The actual results',
    example: [{ address: 'alias1.example@company.com' }],
  })
  results: T[];
}
