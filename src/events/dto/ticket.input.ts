import { Field, InputType } from '@nestjs/graphql';
import { Currency } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

@InputType()
export class TicketInput {
  @IsUUID()
  ticketsDetailId: string;

  @IsOptional()
  @Transform(({ value }) => JSON.stringify(value))
  @Field(() => String)
  discounts?: object; // [{description: "without discount", percentage: 0, amount: 0}]

  @IsInt()
  @Min(1)
  finalPrice: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  ticketsToBuy?: number;

  @IsOptional()
  @IsEnum(Currency)
  @Field(() => String)
  currency?: Currency;
}
