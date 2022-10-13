import { Field, ID, ObjectType } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { Type } from 'class-transformer';

// @ObjectType({ description: 'User model' })
// export class User {
//   @Field(() => ID, { description: 'A unique identifier' })
//   id: string;
//   email: string;
//   firstName: string;
//   lastName: string;
//   password: string;
//   role: string;
// }

@ObjectType()
export class User {
  @Field(() => ID)
  id: string;

  email: string;

  firstName: string;

  lastName: string;

  @Field(() => String)
  role: UserRole;
  // @Type(() => RetrieveEventDto)
  // likedEvents: RetrieveEventDto[];
}
