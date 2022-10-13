import { Field, InputType } from '@nestjs/graphql';
import { EventCategory } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsJSON,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

@InputType()
export class UpdateEventInput {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  title?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  description?: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(EventCategory)
  @IsOptional()
  @Field(() => String)
  category?: EventCategory;

  @IsOptional()
  @IsDateString()
  @Transform(({ value }) => value?.toISOString())
  date?: Date;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  location?: string;

  @IsJSON()
  @IsOptional()
  @Transform(({ value }) => JSON.stringify(value))
  @Field(() => String)
  image?: object;
}
