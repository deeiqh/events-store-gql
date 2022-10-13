import { Field, ID, ObjectType } from '@nestjs/graphql';

@ObjectType({ description: 'User model' })
export class User {
  @Field(() => ID, { description: 'A unique identifier' })
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
}
