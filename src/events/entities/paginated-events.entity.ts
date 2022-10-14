import { ObjectType } from '@nestjs/graphql';
import { Event } from './event.entity';
import { Pagination } from './pagination.entity';

@ObjectType()
export class PaginatedEvents {
  events: Event[];
  pagination?: Pagination;
}
