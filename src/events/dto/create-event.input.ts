import { Field, InputType } from '@nestjs/graphql';
import { EventCategory } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsDateString, IsEnum, IsNotEmpty, IsString } from 'class-validator';

@InputType()
export class CreateEventInput {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(EventCategory)
  @Field(() => String)
  category: EventCategory;

  @Transform(({ value }) => value?.toISOString())
  @IsDateString()
  date: Date;

  @IsString()
  @IsNotEmpty()
  location: string;
}
