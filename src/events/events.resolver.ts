import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { GetUser } from 'src/utils/decorators/get-user.decorator';
import { Roles } from 'src/utils/decorators/roles.decorator';
import { EventOwnershipGuard } from 'src/utils/guards/event-ownershio.guard';
import { GqlAuthGuard } from 'src/utils/guards/gql.guard';
import { RolesGuard } from 'src/utils/guards/role.guard';
import { CreateEventInput } from './dto/create-event.input';
import { GetEventsInput } from './dto/get-event.input';
import { TicketInput } from './dto/ticket.input';
import { TicketsDetailInput } from './dto/tickets-detail.input';
import { UpdateEventInput } from './dto/update-event.input';
import { Event } from './entities/event.entity';
import { Order } from './entities/order.entity';
import { PaginatedEvents } from './entities/paginated-events.entity';
import { TicketsDetail } from './entities/tickets-detail.entity';
import { EventsService } from './events.service';

@Resolver()
export class EventsResolver {
  constructor(private readonly eventsService: EventsService) {}

  @Mutation(() => Event)
  @UseGuards(GqlAuthGuard)
  async createEvent(
    @GetUser() userId: string,
    @Args('input') createEventInput: CreateEventInput,
  ): Promise<Event> {
    return await this.eventsService.createEvent(userId, createEventInput);
  }

  @Query(() => Event)
  async getEvent(
    @Args('id', { type: () => ID }) eventId: string,
  ): Promise<Event> {
    return await this.eventsService.getEvent(eventId);
  }

  @Mutation(() => Event)
  @Roles(UserRole.MANAGER)
  @UseGuards(GqlAuthGuard, RolesGuard)
  async updateEvent(
    @GetUser() userId: string,
    @Args('id', { type: () => ID }) eventId: string,
    @Args('input') updateEventInput: UpdateEventInput,
  ): Promise<Event> {
    return await this.eventsService.updateEvent(
      userId,
      eventId,
      updateEventInput,
    );
  }

  @Query(() => PaginatedEvents)
  async getEvents(
    @Args('input', { nullable: true }) input?: GetEventsInput,
  ): Promise<PaginatedEvents> {
    return await this.eventsService.getEvents(
      input?.category,
      input?.take,
      input?.cursor,
    );
  }

  @Mutation(() => Event)
  @Roles(UserRole.MANAGER)
  @UseGuards(GqlAuthGuard, RolesGuard)
  async deleteEvent(
    @GetUser() userId: string,
    @Args('id') eventId: string,
  ): Promise<Event> {
    return await this.eventsService.deleteEvent(userId, eventId);
  }

  @Mutation(() => TicketsDetail)
  @Roles(UserRole.MANAGER)
  @UseGuards(GqlAuthGuard, RolesGuard, EventOwnershipGuard)
  async createTicketsDetail(
    @Args('input') ticketsDetailInput: TicketsDetailInput,
  ): Promise<TicketsDetail> {
    return await this.eventsService.createTicketsDetail(ticketsDetailInput);
  }

  @Mutation(() => Order)
  @UseGuards(GqlAuthGuard)
  async addToCart(
    @GetUser() userId: string,
    @Args('eventId') eventId: string,
    @Args('ticketInput') ticketInput: TicketInput,
  ): Promise<Order> {
    return await this.eventsService.addToCart(eventId, userId, ticketInput);
  }
}
