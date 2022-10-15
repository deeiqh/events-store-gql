import { faker } from '@faker-js/faker';
import { Injectable } from '@nestjs/common';
import { Currency, Prisma, Ticket } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Factory } from './abstract.factory';

type Args = {
  ticketData?: Partial<Prisma.TicketCreateInput>;
  ticketsDetailId: string;
  eventId: string;
  orderId: string;
};

@Injectable()
export class TicketFactory extends Factory<Ticket> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async make(input: Args = {} as Args): Promise<Ticket> {
    return this.prisma.ticket.create({
      data: {
        ticketsDetailId: input.ticketsDetailId,
        eventId: input.eventId,
        orderId: input.orderId,

        finalPrice: input.ticketData?.finalPrice ?? faker.datatype.number(),
        ticketsToBuy: input.ticketData?.ticketsToBuy ?? faker.datatype.number(),
        currency:
          input.ticketData?.currency ??
          Object.values(Currency)[
            Math.floor(Math.random() * Object.values(Currency).length)
          ],
      },
    });
  }

  async makeMany(fibonacci: number): Promise<Ticket[]> {
    return Promise.all(Array(fibonacci).map(() => this.make()));
  }
}
