import {
  Injectable,
  NotFoundException,
  PreconditionFailedException,
  UnauthorizedException,
} from '@nestjs/common';
import {
  EvenStatus,
  EventCategory,
  OrderStatus,
  TicketStatus,
} from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEventInput } from './dto/create-event.input';
import { TicketInput } from './dto/ticket.input';
import { TicketsDetailInput } from './dto/tickets-detail.input';
import { UpdateEventInput } from './dto/update-event.input';
import { UpdateTicketsDetailInput } from './dto/update-tickets-detail.input';
import { Event } from './entities/event.entity';
import { Order } from './entities/order.entity';
import { PaginatedEvents } from './entities/paginated-events.entity';
import { Ticket } from './entities/ticket.entity';
import { TicketsDetail } from './entities/tickets-detail.entity';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(
    userId: string,
    createEventInput: CreateEventInput,
  ): Promise<Event> {
    const event = await this.prisma.event.create({
      data: {
        userId,
        ...createEventInput,
      },
      include: {
        user: true,
      },
    });

    return plainToInstance(Event, event);
  }

  async getEvent(eventId: string): Promise<Event> {
    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
      include: {
        user: true,
        ticketsDetails: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    return plainToInstance(Event, event);
  }

  async updateEvent(
    userId: string,
    eventId: string,
    updateEventInput: UpdateEventInput,
  ): Promise<Event> {
    try {
      const event = await this.prisma.event.update({
        where: {
          id_userId: {
            id: eventId,
            userId,
          },
        },
        data: {
          ...updateEventInput,
        },
      });
      return plainToInstance(Event, event);
    } catch (error) {
      throw new UnauthorizedException('Only own event can be updated.');
    }
  }

  async getEvents(
    category?: string,
    take?: number,
    cursor?: string,
  ): Promise<PaginatedEvents> {
    if (
      category &&
      !Object.values(EventCategory).includes(category as EventCategory)
    ) {
      throw new NotFoundException('Category not found');
    }

    let pagination;
    if (!take) {
      pagination = {};
    } else if (!cursor) {
      pagination = {
        take,
      };
    } else {
      pagination = {
        take,
        skip: 1,
        cursor: {
          id: cursor,
        },
      };
    }
    const events = await this.prisma.event.findMany({
      where: {
        deletedAt: null,
        OR: [{ status: EvenStatus.SCHEDULED }, { status: EvenStatus.LIVE }],
        category: category as EventCategory,
      },
      include: {
        user: true,
        ticketsDetails: true,
      },
      orderBy: [{ date: 'desc' }, { id: 'asc' }],
      ...pagination,
    });

    if (take) {
      if (events.length === take) {
        cursor = events[take - 1].id;
      } else {
        cursor = undefined;
      }
    }

    return plainToInstance(PaginatedEvents, {
      events: events.map((event) => plainToInstance(Event, event)),
      pagination: { take, cursor },
    });
  }

  async deleteEvent(userId: string, eventId: string): Promise<Event> {
    try {
      const event = await this.prisma.event.update({
        where: {
          id_userId: {
            id: eventId,
            userId,
          },
        },
        data: {
          deletedAt: new Date(),
        },
      });
      return plainToInstance(Event, event);
    } catch (error) {
      throw new UnauthorizedException('Only own event can be deleted.');
    }
  }

  async createTicketsDetail(
    ticketsDetailInput: TicketsDetailInput,
  ): Promise<TicketsDetail> {
    const ticketsDetail = await this.prisma.ticketsDetail.create({
      data: {
        ...ticketsDetailInput,
      },
      include: {
        event: {
          include: {
            user: true,
          },
        },
      },
    });
    return plainToInstance(TicketsDetail, ticketsDetail);
  }

  async getTicketsDetail(ticketsDetailId: string): Promise<TicketsDetail> {
    const ticketsDetail = await this.prisma.ticketsDetail.findUnique({
      where: { id: ticketsDetailId },
    });
    if (!ticketsDetail) {
      throw new NotFoundException('Tickets detail not found');
    }
    return plainToInstance(TicketsDetail, ticketsDetail);
  }

  async getTicketsDetails(eventId: string): Promise<TicketsDetail[]> {
    const ticketsDetails = await this.prisma.ticketsDetail.findMany({
      where: {
        eventId,
        deletedAt: null,
      },
    });

    return ticketsDetails.map((ticketsDetail) =>
      plainToInstance(TicketsDetail, ticketsDetail),
    );
  }

  async updateTicketsDetail(
    ticketsDetailId: string,
    input: UpdateTicketsDetailInput,
  ): Promise<TicketsDetail> {
    const ticketsDetail = await this.prisma.ticketsDetail.update({
      where: { id: ticketsDetailId },
      data: {
        ...input,
      },
    });
    return plainToInstance(TicketsDetail, ticketsDetail);
  }

  async deleteTicketsDetail(ticketsDetailId: string): Promise<TicketsDetail> {
    const ticketsDetail = await this.prisma.ticketsDetail.update({
      where: { id: ticketsDetailId },
      data: {
        deletedAt: new Date(),
      },
    });
    return plainToInstance(TicketsDetail, ticketsDetail);
  }

  async addToCart(
    eventId: string,
    userId: string,
    ticketInput: TicketInput,
  ): Promise<Order> {
    const order = await this.prisma.order.findMany({
      where: {
        userId,
        status: OrderStatus.CART,
      },
    });

    if (order.length > 1) {
      throw new PreconditionFailedException('More than one cart found');
    }

    let orderId;

    if (order.length) {
      orderId = order[0].id;
    } else {
      const newOrder = await this.prisma.order.create({
        data: {
          userId,
        },
      });

      orderId = newOrder.id;
    }

    await this.prisma.ticket.create({
      data: {
        ...ticketInput,
        eventId,
        orderId,
      },
    });
    const ticketPrice = ticketInput.finalPrice;
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        finalPrice: {
          increment: ticketPrice,
        },
      },
      include: {
        user: true,
      },
    });

    return plainToInstance(Order, updatedOrder);
  }

  async buyCart(orderId: string, userId: string): Promise<Order> {
    try {
      const order = await this.prisma.order.update({
        where: {
          id_userId: {
            id: orderId,
            userId,
          },
        },
        data: {
          status: OrderStatus.CLOSED,
        },
      });

      return plainToInstance(Order, order);
    } catch (error) {
      throw new UnauthorizedException('Only cart owner can buy it.');
    }
  }

  async getTickets(eventId: string): Promise<Ticket[]> {
    const tickets = await this.prisma.ticket.findMany({
      where: {
        eventId,
        deletedAt: null,
        OR: [{ status: TicketStatus.RESERVED }, { status: TicketStatus.PAID }],
      },
      include: {
        order: true,
        event: true,
      },
    });
    return tickets.map((ticket) => plainToInstance(Ticket, ticket));
  }
}
