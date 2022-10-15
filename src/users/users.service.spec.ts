import { faker } from '@faker-js/faker';
import { PreconditionFailedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Currency, OrderStatus } from '@prisma/client';
import { EventsService } from 'src/events/events.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventFactory } from 'src/utils/factories/event.factory';
import { OrderFactory } from 'src/utils/factories/order.factory';
import { TicketFactory } from 'src/utils/factories/ticket.factory';
import { TicketsDetailFactory } from 'src/utils/factories/tickets-detail.factory';
import { UserFactory } from 'src/utils/factories/user.factory';
import { clearDatabase } from 'src/utils/prisma/prisma.util';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let prisma: PrismaService;
  let service: UsersService;
  let eventsService: EventsService;
  let userFactory: UserFactory;
  let orderFactory: OrderFactory;
  let ticketFactory: TicketFactory;

  let ticketsDetailFactory: TicketsDetailFactory;
  let eventFactory: EventFactory;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService, PrismaService, EventsService, ConfigService],
    }).compile();

    service = module.get<UsersService>(UsersService);
    eventsService = module.get<EventsService>(EventsService);
    prisma = module.get<PrismaService>(PrismaService);

    userFactory = new UserFactory(prisma);
    orderFactory = new OrderFactory(prisma);
    eventFactory = new EventFactory(prisma);
    ticketFactory = new TicketFactory(prisma);
    ticketsDetailFactory = new TicketsDetailFactory(prisma);
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('getUser', () => {
    it('should retrieve user', async () => {
      const { id, firstName } = await userFactory.make();
      const user = await service.getUser(id);
      expect(user).toHaveProperty('firstName', firstName);
    });
  });

  describe('updateUser', () => {
    it('should update user', async () => {
      const { id } = await userFactory.make();
      const firstName = faker.name.firstName();

      const user = await service.updateUser(id, { firstName });

      expect(user).toHaveProperty('firstName', firstName);
    });
  });

  describe('getCart', () => {
    it('should throw an error if more than one cart order', async () => {
      const { id: userId } = await userFactory.make();
      await orderFactory.make({ userId, status: OrderStatus.CART });
      await orderFactory.make({ userId, status: OrderStatus.CART });

      await expect(service.getCart(userId)).rejects.toThrowError(
        new PreconditionFailedException('More than one cart found'),
      );
    });

    it('should retrieve an empty object if there is no cart', async () => {
      const { id: userId } = await userFactory.make();
      const cart = await service.getCart(userId);
      expect(cart).toEqual({});
    });

    it('should retrieve the cart', async () => {
      const { id: userId } = await userFactory.make();
      await orderFactory.make({ userId, status: 'CART' });

      const cart = await service.getCart(userId);

      expect(cart).toHaveProperty('status', OrderStatus.CART);
    });
  });

  describe('updateTicket', () => {
    it('should update the user event ticket', async () => {
      const { id: userId } = await userFactory.make();
      const { id: eventId } = await eventFactory.make({ userId });
      const { id: ticketsDetailId } = await ticketsDetailFactory.make({
        eventId,
      });
      const { id: orderId } = await orderFactory.make({
        userId,
        status: 'CART',
      });
      const { id: ticketId } = await ticketFactory.make({
        ticketsDetailId,
        eventId,
        orderId,
      });
      const ticketData = {
        ticketsDetailId,
        finalPrice: faker.datatype.number(),
        ticketsToBuy: faker.datatype.number(),
        currency:
          Object.values(Currency)[
            Math.floor(Math.random() * Object.values(Currency).length)
          ],
      };

      const result = await service.updateTicket(ticketId, ticketData);

      expect(result).toHaveProperty('finalPrice', ticketData.finalPrice);
    });
  });

  describe('deleteTicket', () => {
    it('should delete the ticket', async () => {
      const { id: userId } = await userFactory.make();
      const { id: eventId } = await eventFactory.make({ userId });
      const { id: ticketsDetailId } = await ticketsDetailFactory.make({
        eventId,
      });
      const { id: orderId } = await orderFactory.make({
        userId,
        status: 'CART',
      });

      const { id: ticketId } = await ticketFactory.make({
        ticketsDetailId,
        eventId,
        orderId,
      });

      const ticket = await service.deleteTicket(ticketId);

      expect(ticket.deletedAt).not.toEqual(null);
    });
  });

  describe('buyCart', () => {
    it('should buy the cart order', async () => {
      const { id: userId } = await userFactory.make();
      await orderFactory.make({
        userId,
        status: OrderStatus.CART,
      });

      const order = await service.buyCart(userId);
      expect(order).toHaveProperty('status', OrderStatus.CLOSED);
    });
  });

  describe('getOrders', () => {
    it('should get the user orders', async () => {
      const { id: userId } = await userFactory.make();
      await orderFactory.make({
        userId,
        status: OrderStatus.CART,
      });

      const order = await service.getOrders(userId);

      expect(order).toHaveLength(1);
      expect(order[0]).toHaveProperty('status', OrderStatus.CART);
    });
  });

  describe('deleteOrder', () => {
    it('should delete the user order', async () => {
      const { id: userId } = await userFactory.make();
      const { id: orderId } = await orderFactory.make({
        userId,
        status: 'CART',
      });

      const order = await service.deleteOrder(orderId);

      expect(order.deletedAt).not.toEqual(null);
    });
  });

  describe('getLikedEvents', () => {
    it('should retrieve the user liked events', async () => {
      const { id: userId } = await userFactory.make();
      const { id: eventId } = await eventFactory.make({ userId });
      await eventsService.likeOrDislikeEvent(userId, eventId);

      const event = await service.getLikedEvents(userId);

      expect(event).toHaveLength(1);
      expect(event[0]).toHaveProperty('title');
    });
  });

  describe('getEvents', () => {
    it('should retrieve the events presented in user orders', async () => {
      const { id: userId } = await userFactory.make();
      const { id: eventId } = await eventFactory.make({ userId });
      const { id: ticketsDetailId } = await ticketsDetailFactory.make({
        eventId,
      });
      const ticketData = {
        ticketsDetailId,
        finalPrice: faker.datatype.number(),
        ticketsToBuy: faker.datatype.number(),
        currency:
          Object.values(Currency)[
            Math.floor(Math.random() * Object.values(Currency).length)
          ],
      };
      await eventsService.addToCart(eventId, userId, ticketData);

      const event = await service.getEvents(userId);

      expect(event).toHaveLength(1);
      expect(event[0]).toHaveProperty('title');
    });
  });
});
