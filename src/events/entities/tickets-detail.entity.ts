import { Field, ObjectType } from '@nestjs/graphql';
import { Currency, EventZone } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
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

  @Transform(({ value }) => value?.toISOString())
  updatedAt: Date;

  eventId: string;

  @Transform(({ value }) => value?.toISOString())
  deletedAt?: Date;

  @Type(() => Event)
  event: Event;
}
