import {
  Injectable,
  NotFoundException,
  PreconditionFailedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { OrderStatus, TicketStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from './entities/user.entity';
import { Order } from 'src/events/entities/order.entity';
import { TicketInput } from 'src/events/dto/ticket.input';
import { Ticket } from 'src/events/entities/ticket.entity';
import { Event } from 'src/events/entities/event.entity';
import { SendgridService } from 'src/auth/sendgrid.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sendgridService: SendgridService,
    private readonly configService: ConfigService,
  ) {}

  async getUser(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    return plainToInstance(User, user);
  }

  async updateUser(
    userId: string,
    updateUserInput: UpdateUserInput,
  ): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          ...updateUserInput,
        },
      });
      return plainToInstance(User, user);
    } catch (error) {
      throw new UnprocessableEntityException('Email already exists');
    }
  }

  async getCart(userId: string): Promise<Order> {
    const cart = await this.prisma.order.findMany({
      where: {
        userId,
        status: OrderStatus.CART,
        deletedAt: null,
      },
      include: {
        tickets: {
          where: {
            deletedAt: null,
            status: TicketStatus.RESERVED,
          },
        },
      },
    });

    if (cart.length > 1) {
      throw new PreconditionFailedException('More than one cart found');
    }

    if (!cart.length) {
      return plainToInstance(Order, {});
    }

    return plainToInstance(Order, cart[0]);
  }

  async updateTicket(
    ticketId: string,
    ticketInput: TicketInput,
  ): Promise<Ticket> {
    const ticket = await this.prisma.ticket.update({
      where: {
        id: ticketId,
      },
      data: {
        ...ticketInput,
      },
    });
    return plainToInstance(Ticket, ticket);
  }

  async deleteTicket(ticketId: string): Promise<Ticket> {
    const ticket = await this.prisma.ticket.update({
      where: {
        id: ticketId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
    return plainToInstance(Ticket, ticket);
  }

  async buyCart(userId: string, orderId?: string): Promise<Order> {
    if (!orderId) {
      ({ id: orderId } = await this.getCart(userId));
    }

    if (!orderId) {
      throw new NotFoundException('Cart not found');
    }

    const updatedOrder = await this.prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        tickets: {
          updateMany: {
            where: {
              status: TicketStatus.RESERVED,
              deletedAt: null,
            },
            data: {
              status: TicketStatus.PAID,
            },
          },
        },
        status: OrderStatus.CLOSED,
      },
      include: {
        tickets: {
          where: {
            status: TicketStatus.PAID,
          },
          select: {
            status: true,
            ticketsDetailId: true,
            ticketsToBuy: true,
          },
        },
      },
    });

    const ticketsDetails = await Promise.all(
      updatedOrder.tickets.map(
        async (ticket) =>
          await this.prisma.ticketsDetail.update({
            where: {
              id: ticket.ticketsDetailId,
            },
            data: {
              ticketsAvailable: {
                decrement: 1 * ticket.ticketsToBuy,
              },
            },
            select: {
              ticketsAvailable: true,
              id: true,
              event: {
                select: {
                  id: true,
                  likes: {
                    select: {
                      email: true,
                    },
                    take: -1,
                  },
                },
              },
            },
          }),
      ),
    );

    const set = new Set<{
      email: string;
      eventId: string;
      ticketsDetailId: string;
    }>();

    ticketsDetails.map((ticketsDetail) => {
      if (ticketsDetail.ticketsAvailable <= 3) {
        set.add({
          email: ticketsDetail.event.likes[0].email,
          eventId: ticketsDetail.event.id,
          ticketsDetailId: ticketsDetail.id,
        });
      }
    });

    set.forEach(async (element) => {
      const mail = {
        to: element.email,
        subject: 'Reset password',
        from: this.configService.get<string>('SENDGRID_EMAIL') as string,
        text: `There are the last 3 tickets for the event ${element.eventId} with tickets of type ${element.ticketsDetailId}`,
        html: `<p>There are the last 3 tickets for the event ${element.eventId} with tickets of type ${element.ticketsDetailId}</p>`,
      };
      await this.sendgridService.send(mail);
    });

    return plainToInstance(Order, updatedOrder);
  }

  async getOrders(userId: string): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        userId,
      },
    });
    return orders.map((order) => plainToInstance(Order, order));
  }

  async deleteOrder(orderId: string): Promise<Order> {
    const order = await this.prisma.order.update({
      where: {
        id: orderId,
      },
      data: {
        deletedAt: new Date(),
      },
    });
    return plainToInstance(Order, order);
  }

  async getLikedEvents(userId: string): Promise<Event[]> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      select: {
        likedEvents: true,
      },
    });

    return user.likedEvents.map((event) => plainToInstance(Event, event));
  }

  async getEvents(userId: string): Promise<Event[]> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      select: {
        orders: {
          select: {
            tickets: {
              select: {
                event: true,
              },
            },
          },
        },
      },
    });
    const events: Event[] = [];
    user.orders.map((order) =>
      order.tickets.map((ticket) =>
        events.push(plainToInstance(Event, ticket.event)),
      ),
    );

    return events;
  }
}
