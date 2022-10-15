import { Field, ObjectType } from '@nestjs/graphql';
import { Currency, EventZone } from '@prisma/client';
import { Type } from 'class-transformer';
import { Event } from './event.entity';

@ObjectType()
export class TicketsDetail {
  id: string;

  nominalPrice: number;

  ticketsAvailable: number;

  @Field(() => String)
  zone: EventZone;

  ticketsPerPerson: number;

  @Field(() => String)
  currency: Currency;

  updatedAt: Date;

  eventId: string;

  deletedAt?: Date;

  @Type(() => Event)
  event: Event;
}
