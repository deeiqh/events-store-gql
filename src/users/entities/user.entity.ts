import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { Type } from 'class-transformer';
import { Event } from 'src/events/entities/event.entity';

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  email: string;

  firstName: string;

  lastName: string;

  @Field(() => String)
  role: UserRole;

  @Type(() => Event)
  likedEvents: Event[];
}
