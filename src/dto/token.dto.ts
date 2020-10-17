import { IsDefined, IsNotEmpty, IsString } from 'class-validator';

export abstract class TokenDto {
  @IsDefined()
  @IsString()
  @IsNotEmpty()
  token: string;
}
