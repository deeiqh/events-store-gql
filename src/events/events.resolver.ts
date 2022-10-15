import { UseGuards } from '@nestjs/common';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { UserRole } from '@prisma/client';
import { GraphQLUpload, FileUpload } from 'graphql-upload';
import { User } from 'src/users/entities/user.entity';
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
import { UpdateTicketsDetailInput } from './dto/update-tickets-detail.input';
import { Event } from './entities/event.entity';
import { Order } from './entities/order.entity';
import { PaginatedEvents } from './entities/paginated-events.entity';
import { Ticket } from './entities/ticket.entity';
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

  @Query(() => Event, { name: 'event' })
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

  @Query(() => PaginatedEvents, { name: 'events' })
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

  @Query(() => TicketsDetail, { name: 'ticketsDetail' })
  async getTicketsDetail(
    @Args('id') ticketsDetailId: string,
  ): Promise<TicketsDetail> {
    return await this.eventsService.getTicketsDetail(ticketsDetailId);
  }

  @Query(() => [TicketsDetail], { name: 'ticketsDetails' })
  async getTicketsDetails(
    @Args('eventId') eventId: string,
  ): Promise<TicketsDetail[]> {
    return await this.eventsService.getTicketsDetails(eventId);
  }

  @Mutation(() => TicketsDetail)
  @Roles(UserRole.MANAGER)
  @UseGuards(GqlAuthGuard, RolesGuard, EventOwnershipGuard)
  async updateTicketsDetail(
    @Args('input') input: UpdateTicketsDetailInput,
    @Args('ticketsDetailId') ticketsDetailId: string,
  ): Promise<TicketsDetail> {
    return await this.eventsService.updateTicketsDetail(ticketsDetailId, input);
  }

  @Mutation(() => TicketsDetail)
  @Roles(UserRole.MANAGER)
  @UseGuards(GqlAuthGuard, RolesGuard, EventOwnershipGuard)
  async deleteTicketsDetail(
    @Args('ticketsDetailId') ticketsDetailId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    @Args('eventId') eventId: string,
  ): Promise<TicketsDetail> {
    return await this.eventsService.deleteTicketsDetail(ticketsDetailId);
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

  @Mutation(() => Order)
  @UseGuards(GqlAuthGuard)
  async buyCart(
    @GetUser() userId: string,
    @Args('orderId') orderId: string,
  ): Promise<Order> {
    return await this.eventsService.buyCart(orderId, userId);
  }

  @Mutation(() => Order)
  @UseGuards(GqlAuthGuard)
  async buyEvent(
    @GetUser() userId: string,
    @Args('eventId') eventId: string,
    @Args('ticketInput') ticketInput: TicketInput,
  ): Promise<Order> {
    const order = await this.eventsService.addToCart(
      eventId,
      userId,
      ticketInput,
    );
    return await this.eventsService.buyCart(order.id, userId);
  }

  @Query(() => [Ticket], { name: 'tickets' })
  @Roles(UserRole.MANAGER)
  @UseGuards(GqlAuthGuard, RolesGuard, EventOwnershipGuard)
  async getTickets(@Args('eventId') eventId: string): Promise<Ticket[]> {
    return await this.eventsService.getTickets(eventId);
  }

  @Mutation(() => Event)
  @UseGuards(GqlAuthGuard)
  async likeOrDislikeEvent(
    @GetUser() userId: string,
    @Args('eventId') eventId: string,
  ): Promise<Event> {
    return await this.eventsService.likeOrDislikeEvent(userId, eventId);
  }

  @Query(() => [User], { name: 'likes' })
  async getLikes(@Args('eventId') eventId: string): Promise<User[]> {
    return this.eventsService.getLikes(eventId);
  }

  @Mutation(() => Event)
  @Roles(UserRole.MANAGER)
  @UseGuards(GqlAuthGuard, RolesGuard)
  async uploadImage(
    @Args('eventId') eventId: string,
    @Args('image', { type: () => GraphQLUpload }) image: FileUpload,
  ): Promise<Event> {
    return this.eventsService.uploadImage(
      eventId,
      image.createReadStream(),
      image.filename,
    );
  }
}
