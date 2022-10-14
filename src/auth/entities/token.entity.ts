import { ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Token {
  token: string;
  expiration: string;
}
