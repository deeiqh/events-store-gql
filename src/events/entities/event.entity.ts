import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Transform, Type } from 'class-transformer';
import { User } from 'src/users/entities/user.entity';
import { TicketsDetail } from './tickets-detail.entity';

@ObjectType()
export class Event {
  @Field(() => ID)
  id: string;

  title: string;

  description: string;

  category: string;

  date: Date;

  location: string;

  @Transform(({ value }) => JSON.stringify(value))
  @Field(() => String)
  image: object;

  user: User;

  status: string;

  createdAt: Date;

  updatedAt: Date;

  @Type(() => TicketsDetail)
  ticketsDetail: TicketsDetail[];

  @Type(() => User)
  likes: User[];

  @Transform(({ value }) => value?.toISOString())
  deletedAt?: Date;
}
