import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { EvenStatus, EventCategory } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEventInput } from './dto/create-event.input';
import { UpdateEventInput } from './dto/update-event.input';
import { Event } from './entities/event.entity';
import { PaginatedEvents } from './entities/paginated-events.entity';

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
}
