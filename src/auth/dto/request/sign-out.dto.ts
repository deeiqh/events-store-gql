import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignOutDto {
  @ApiProperty()
  @IsString()
  token: string;
}
