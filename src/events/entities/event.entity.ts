import { Field, ID, ObjectType } from '@nestjs/graphql';
import { Transform, Type } from 'class-transformer';
import { User } from 'src/users/entities/user.entity';

@ObjectType()
export class Event {
  @Field(() => ID)
  id: string;

  title: string;

  description: string;

  category: string;

  @Field(() => String)
  date: Date;

  location: string;

  @Transform(({ value }) => JSON.stringify(value))
  @Field(() => String)
  image: object;

  user: User;

  status: string;

  createdAt: Date;

  updatedAt: Date;

  // @Type(() => RetrieveTicketsDetailDto)
  // ticketsDetail: RetrieveTicketsDetailDto[];

  @Type(() => User)
  likes: User[];

  deletedAt: Date;
}
