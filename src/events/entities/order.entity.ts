import { Field, ObjectType } from '@nestjs/graphql';
import { Currency, OrderStatus } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import { User } from 'src/users/entities/user.entity';
import { Ticket } from './ticket.entity';

@ObjectType()
export class Order {
  id: string;

  @Transform(({ value }) => JSON.stringify(value))
  @Field(() => String)
  discounts: object; // [{description: "without discount", percentage: 0, amount: 0}]

  finalPrice: number;

  @Field(() => String)
  status: OrderStatus;

  @Field(() => String)
  currency: Currency;

  updatedAt: Date;

  @Type(() => Ticket)
  tickets: Ticket[];

  @Type(() => User)
  user: User;

  deletedAt?: Date;
}
