import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { InputType } from '@nestjs/graphql';

@InputType()
export class RegisterInput {
  @IsString()
  firstName: string;

  @IsString()
  lastName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
