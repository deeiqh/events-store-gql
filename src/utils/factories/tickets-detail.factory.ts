import { faker } from '@faker-js/faker';
import { Inject } from '@nestjs/common';
import { Currency, EventZone, Prisma, TicketsDetail } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Factory } from './abstract.factory';

type Args = {
  ticketsDetailData?: Partial<Prisma.TicketsDetailCreateInput>;
  eventId: string;
};

export class TicketsDetailFactory extends Factory<TicketsDetail> {
  @Inject(PrismaService)
  private prisma: PrismaService;

  async make(input: Args = {} as Args): Promise<TicketsDetail> {
    return this.prisma.ticketsDetail.create({
      data: {
        eventId: input.eventId,

        nominalPrice:
          input.ticketsDetailData?.nominalPrice ?? faker.datatype.number(),
        ticketsAvailable:
          input.ticketsDetailData?.ticketsAvailable ?? faker.datatype.number(),
        zone:
          input.ticketsDetailData?.zone ??
          Object.values(EventZone)[
            Math.floor(Math.random() * Object.values(EventZone).length)
          ],
        ticketsPerPerson:
          input.ticketsDetailData?.ticketsPerPerson ?? faker.datatype.number(),
        currency:
          input.ticketsDetailData?.currency ??
          Object.values(Currency)[
            Math.floor(Math.random() * Object.values(Currency).length)
          ],
      },
    });
  }

  async makeMany(fibonacci: number): Promise<TicketsDetail[]> {
    return Promise.all(Array(fibonacci).map(() => this.make()));
  }
}
