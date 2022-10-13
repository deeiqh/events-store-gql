import { Injectable, NotFoundException } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateEventInput } from './dto/create-event.input';
import { Event } from './entities/event.entity';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async createEvent(
    userId: string,
    createEventInput: CreateEventInput,
  ): Promise<Event> {
    createEventInput.date = new Date(createEventInput.date);

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
}
