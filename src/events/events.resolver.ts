import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { GetUser } from 'src/utils/decorators/get-user.decorator';
import { Roles } from 'src/utils/decorators/roles.decorator';
import { GqlAuthGuard } from 'src/utils/guards/gql.guard';
import { RolesGuard } from 'src/utils/guards/role.guard';
import { CreateEventInput } from './dto/create-event.input';
import { UpdateEventInput } from './dto/update-event.input';
import { Event } from './entities/event.entity';
import { EventsService } from './events.service';

@Resolver()
export class EventsResolver {
  constructor(private readonly eventsService: EventsService) {}

  @Mutation(() => Event, { name: 'event' })
  @UseGuards(GqlAuthGuard)
  async createEvent(
    @GetUser() userId: string,
    @Args('createEventInput') createEventInput: CreateEventInput,
  ): Promise<Event> {
    return await this.eventsService.createEvent(userId, createEventInput);
  }

  @Query(() => Event, { name: 'event' })
  async getEvent(
    @Args('id', { type: () => ID }) eventId: string,
  ): Promise<Event> {
    return await this.eventsService.getEvent(eventId);
  }

  @Mutation(() => Event, { name: 'event' })
  @Roles(UserRole.MANAGER)
  @UseGuards(GqlAuthGuard, RolesGuard)
  async updateEvent(
    @GetUser() userId: string,
    @Args('id', { type: () => ID }) eventId: string,
    @Args('updateEventInput') updateEventInput: UpdateEventInput,
  ): Promise<Event> {
    return await this.eventsService.updateEvent(
      userId,
      eventId,
      updateEventInput,
    );
  }
}
