import { ApiProperty } from '@nestjs/swagger';

export class RetrieveTokenDto {
  @ApiProperty()
  token: string;
  @ApiProperty()
  expiration: string;
}
