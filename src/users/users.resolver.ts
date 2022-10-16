import { UseGuards } from '@nestjs/common';
import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { TicketInput } from 'src/events/dto/ticket.input';
import { Order } from 'src/events/entities/order.entity';
import { Ticket } from 'src/events/entities/ticket.entity';
import { GetUser } from 'src/utils/decorators/get-user.decorator';
import { CartOwnerShipGuard } from 'src/utils/guards/cart-ownership.guard';
import { GqlAuthGuard } from 'src/utils/guards/gql.guard';
import { OrderOwnershipGuard } from 'src/utils/guards/order-ownership.guard';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';
import { Event } from 'src/events/entities/event.entity';
import { Roles } from 'src/utils/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { RolesGuard } from 'src/utils/guards/role.guard';

@Resolver()
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Query(() => User, { name: 'me' })
  @UseGuards(GqlAuthGuard)
  async getUser(@GetUser() userId: string): Promise<User> {
    return await this.usersService.getUser(userId);
  }

  @Mutation(() => User, { name: 'me' })
  @UseGuards(GqlAuthGuard)
  async updateUser(
    @GetUser() userId: string,
    @Args('updateUserInput') updateUserInput: UpdateUserInput,
  ): Promise<User> {
    return await this.usersService.updateUser(userId, updateUserInput);
  }

  @Query(() => Order, { name: 'cart' })
  @UseGuards(GqlAuthGuard)
  async getCart(@GetUser() userId: string): Promise<Order> {
    return await this.usersService.getCart(userId);
  }

  @Mutation(() => Ticket)
  @UseGuards(GqlAuthGuard, CartOwnerShipGuard)
  async updateTicket(
    @Args('ticketId') ticketId: string,
    @Args('ticketInput') ticketInput: TicketInput,
  ): Promise<Ticket> {
    return await this.usersService.updateTicket(ticketId, ticketInput);
  }

  @Mutation(() => Ticket)
  @UseGuards(GqlAuthGuard, CartOwnerShipGuard)
  async deleteTicket(@Args('ticketId') ticketId: string): Promise<Ticket> {
    return await this.usersService.deleteTicket(ticketId);
  }

  @Mutation(() => Order)
  @UseGuards(GqlAuthGuard)
  async buyCart(@GetUser() userId: string): Promise<Order> {
    return await this.usersService.buyCart(userId);
  }

  @Query(() => Order, { name: 'orders' })
  @UseGuards(GqlAuthGuard)
  async getOrders(@GetUser() userId: string): Promise<Order[]> {
    return await this.usersService.getOrders(userId);
  }

  @Mutation(() => Order)
  @UseGuards(GqlAuthGuard, OrderOwnershipGuard)
  async deleteOrder(@Args('orderId') orderId: string): Promise<Order> {
    return await this.usersService.deleteOrder(orderId);
  }

  @Query(() => [Event], { name: 'likedEvents' })
  @UseGuards(GqlAuthGuard)
  async getLikedEvents(@GetUser() userId: string): Promise<Event[]> {
    return this.usersService.getLikedEvents(userId);
  }

  @Query(() => [Event], { name: 'events' })
  @UseGuards(GqlAuthGuard)
  async getEvents(@GetUser() userId: string): Promise<Event[]> {
    return this.usersService.getEvents(userId);
  }

  @Query(() => [Order], { name: 'orders' })
  @Roles(UserRole.MANAGER)
  @UseGuards(GqlAuthGuard, RolesGuard)
  async getUserOrders(@Args('userId') userId: string): Promise<Order[]> {
    return await this.usersService.getOrders(userId);
  }

  @Mutation(() => Order)
  @Roles(UserRole.MANAGER)
  @UseGuards(GqlAuthGuard, RolesGuard)
  async deleteUserOrder(@Args('orderId') orderId: string): Promise<Order> {
    return await this.usersService.deleteOrder(orderId);
  }
}
