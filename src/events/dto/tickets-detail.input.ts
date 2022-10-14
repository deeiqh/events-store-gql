import { Field, InputType } from '@nestjs/graphql';
import { Currency, EventZone } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

@InputType()
export class TicketsDetailInput {
  @IsUUID()
  eventId: string;

  @IsInt()
  @Min(1)
  nominalPrice: number;

  @IsInt()
  @Min(0)
  ticketsAvailable: number;

  @IsOptional()
  @IsEnum(EventZone)
  @Field(() => String)
  zone?: EventZone;

  @IsOptional()
  @IsInt()
  @Min(1)
  ticketsPerPerson?: number;

  @IsOptional()
  @IsEnum(Currency)
  @Field(() => String)
  currency?: Currency;
}
