import { Field, ObjectType } from '@nestjs/graphql';
import { Currency, TicketStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { Event } from './event.entity';
import { Order } from './order.entity';
import { TicketsDetail } from './tickets-detail.entity';

@ObjectType()
export class Ticket {
  id: string;

  @Transform(({ value }) => JSON.stringify(value))
  @Field(() => String)
  discounts?: object; // [{description: "without discount", percentage: 0, amount: 0}]

  finalPrice: number;

  ticketsToBuy: number;

  @Field(() => String)
  currency: Currency;

  @Field(() => String)
  status: TicketStatus;

  updatedAt: Date;

  @Type(() => TicketsDetail)
  ticketsDetail: TicketsDetail;

  deletedAt?: Date;

  order: Order;

  event: Event;
}
