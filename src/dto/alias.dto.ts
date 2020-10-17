import { IsDefined, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export abstract class AliasDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  address: string;
}
