import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GetUser } from 'src/utils/decorators/get-user.decorator';
import { GqlGuard } from 'src/utils/guards/gql.guard';
import { CreateEventInput } from './dto/create-event.input';
import { Event } from './entities/event.entity';
import { EventsService } from './events.service';

@Resolver()
export class EventsResolver {
  constructor(private readonly eventsService: EventsService) {}

  @Mutation(() => Event, { name: 'event' })
  @UseGuards(GqlGuard)
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
}
