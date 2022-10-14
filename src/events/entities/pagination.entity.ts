import { ObjectType } from '@nestjs/graphql';

@ObjectType()
export class Pagination {
  take?: number;
  cursor?: string;
}
