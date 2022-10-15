import { Injectable } from '@nestjs/common';
import { Order, OrderStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Factory } from './abstract.factory';

type Args = {
  userId: string;
  status: OrderStatus;
};

@Injectable()
export class OrderFactory extends Factory<Order> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }
  async make(input: Args = {} as Args): Promise<Order> {
    return this.prisma.order.create({
      data: {
        userId: input.userId,
        status:
          input.status ??
          Object.values(OrderStatus)[
            Math.floor(Math.random() * Object.values(OrderStatus).length)
          ],
      },
    });
  }

  async makeMany(fibonacci: number): Promise<Order[]> {
    return Promise.all(Array(fibonacci).map(() => this.make()));
  }
}
