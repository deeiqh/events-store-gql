import { NotFoundException, PreconditionFailedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { faker } from '@faker-js/faker';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserFactory } from 'src/utils/factories/user.factory';
import { clearDatabase } from 'src/utils/prisma/prisma.util';
import { EventsService } from './events.service';
import { EventFactory } from 'src/utils/factories/event.factory';
import { TicketsDetailFactory } from 'src/utils/factories/tickets-detail.factory';
import { Currency, EventCategory, OrderStatus } from '@prisma/client';
import { OrderFactory } from 'src/utils/factories/order.factory';
import { TicketFactory } from 'src/utils/factories/ticket.factory';
import { UpdateEventInput } from './dto/update-event.input';
import { TicketInput } from './dto/ticket.input';

describe('EventsService', () => {
  let prisma: PrismaService;
  let service: EventsService;
  let userFactory: UserFactory;
  let eventFactory: EventFactory;
  let ticketsDetailFactory: TicketsDetailFactory;
  let orderFactory: OrderFactory;
  let ticketFactory: TicketFactory;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService, EventsService, ConfigService],
    }).compile();

    service = module.get<EventsService>(EventsService);
    prisma = module.get<PrismaService>(PrismaService);

    userFactory = new UserFactory(prisma);
    eventFactory = new EventFactory(prisma);
    ticketsDetailFactory = new TicketsDetailFactory(prisma);
    orderFactory = new OrderFactory(prisma);
    ticketFactory = new TicketFactory(prisma);
  });

  afterAll(async () => {
    await clearDatabase(prisma);
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  describe('getEvents', () => {
    it('should throw an error if category not found', async () => {
      await expect(service.getEvents('musicTheater')).rejects.toThrow(
        new NotFoundException('Category not found'),
      );
    });

    it('should thorw an error if wrong category', async () => {
      await expect(service.getEvents('CULTURE')).rejects.toThrow(
        new NotFoundException('Category not found'),
      );
    });

    it("shouldn't do pagination if take parameter is not provided", async () => {
      const { id: userId } = await userFactory.make();
      await eventFactory.make({
        userId,
        eventData: { category: EventCategory.MUSIC },
      });

      const result = await service.getEvents(EventCategory.MUSIC);
      expect(result.pagination).toEqual({
        take: undefined,
        cursor: undefined,
      });
    });

    it('should start from first record if cursor is not provided', async () => {
      const { id: userId } = await userFactory.make();
      await eventFactory.make({
        userId,
        eventData: { category: EventCategory.MUSIC },
      });
      const take = 3;

      const result = await service.getEvents(EventCategory.MUSIC, take);

      expect(result).toHaveProperty('pagination', {
        take: 3,
        cursor: result.pagination?.cursor,
      });
    });

    it('should start from cursor if provided taken and cursor', async () => {
      const { id: userId } = await userFactory.make();
      await eventFactory.make({
        userId,
        eventData: { category: EventCategory.MUSIC },
      });
      const take = 3;
      const cursor = (await service.getEvents(EventCategory.MUSIC, take))
        .pagination?.cursor;

      const result = await service.getEvents(EventCategory.MUSIC, take, cursor);

      expect(result).toHaveProperty('pagination', {
        take: 3,
        cursor: result.pagination?.cursor,
      });
    });

    it('should return remaining events if take is bigger, without new cursor', async () => {
      const { id: userId } = await userFactory.make();
      await eventFactory.make({
        userId,
        eventData: { category: EventCategory.MUSIC },
      });
      const take = 13;

      const result = await service.getEvents(EventCategory.MUSIC, take);

      expect(result).toHaveProperty('pagination', {
        take: 13,
        cursor: undefined,
      });
    });
  });

  describe('createEvent', () => {
    it('should create the event for the user', async () => {
      const { id: oldUserId } = await userFactory.make();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { userId, id, ...eventData } = await eventFactory.make({
        userId: oldUserId,
      });
      const { id: newUserId } = await userFactory.make();
      const newEvent = await service.createEvent(newUserId, eventData);

      expect(newEvent).toHaveProperty('id');
      expect(newEvent).toHaveProperty('title', eventData.title);
    });
  });

  describe('getEvent', () => {
    it('should throw error if event not found', async () => {
      await expect(
        service.getEvent(faker.datatype.uuid()),
      ).rejects.toThrowError(new NotFoundException('Event not found'));
    });

    it('should retrieve event if event exists', async () => {
      const { id: userId } = await userFactory.make();
      const { id, title } = await eventFactory.make({ userId });

      const event = await service.getEvent(id);

      expect(event).toHaveProperty('id', id);
      expect(event).toHaveProperty('title', title);
    });
  });

  describe('updateEvent', () => {
    it('should update the event', async () => {
      const { id: userId } = await userFactory.make();
      const { id, ...eventData } = await eventFactory.make({ userId });

      const result = await service.updateEvent(
        userId,
        id,
        eventData as UpdateEventInput,
      );

      expect(result).toHaveProperty('id', id);
      expect(result).toHaveProperty('title', eventData.title);
    });
  });

  describe('deleteEvent', () => {
    it('should delete the event', async () => {
      const { id: userId } = await userFactory.make();
      const { id } = await eventFactory.make({ userId });
      const event = await service.deleteEvent(userId, id);
      expect(event.deletedAt).not.toEqual(null);
    });
  });

  describe('addToCart', () => {
    let eventId: string;
    let ticketsDetailId: string;
    let userId: string;
    let ticketData: TicketInput;

    beforeEach(async () => {
      const { id: userIdAux } = await userFactory.make();
      eventId = (await eventFactory.make({ userId: userIdAux })).id;
      ticketsDetailId = (
        await ticketsDetailFactory.make({
          eventId,
        })
      ).id;
      ticketData = {
        ticketsDetailId,
        finalPrice: faker.datatype.number(),
        ticketsToBuy: faker.datatype.number(),
        currency:
          Object.values(Currency)[
            Math.floor(Math.random() * Object.values(Currency).length)
          ],
      };

      userId = (await userFactory.make()).id;
    });

    it('should throw an error if more than one cart found', async () => {
      await orderFactory.make({ userId, status: OrderStatus.CART });
      await orderFactory.make({ userId, status: OrderStatus.CART });

      await expect(
        service.addToCart(eventId, userId, ticketData),
      ).rejects.toThrowError(
        new PreconditionFailedException('More than one cart found'),
      );
    });

    it('should select current CART order if one is found', async () => {
      const order = await orderFactory.make({
        userId,
        status: OrderStatus.CART,
      });
      const result = await service.addToCart(eventId, userId, ticketData);
      expect(result).toHaveProperty('id', order.id);
    });

    it('should creat new CART order if no one is found', async () => {
      const result = await service.addToCart(eventId, userId, ticketData);
      expect(result).toHaveProperty('id');
    });
  });

  describe('buyCart', () => {
    it('should change the order status from CART to CLOSED', async () => {
      const { id: userId } = await userFactory.make();
      const { id: orderId } = await orderFactory.make({
        userId,
        status: OrderStatus.CART,
      });

      const result = await service.buyCart(orderId, userId);

      expect(result).toHaveProperty('status', OrderStatus.CLOSED);
    });
  });

  describe('getTicketsDetails', () => {
    it('should retrieve tickets details info', async () => {
      const { id: userId } = await userFactory.make();
      const { id: eventId } = await eventFactory.make({ userId });
      await ticketsDetailFactory.make({ eventId });

      const result = await service.getTicketsDetails(eventId);

      expect(result).toHaveProperty('length');
      if (result.length) {
        expect(result[0]).toHaveProperty('zone');
      }
    });
  });

  describe('createTicketsDetail', () => {
    it('should create tickets detail for an event', async () => {
      const { id: userId } = await userFactory.make();
      const { id: eventId } = await eventFactory.make({ userId });
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id, ...ticketDetailInfo } = await ticketsDetailFactory.make({
        eventId,
      });

      const result = await service.createTicketsDetail(ticketDetailInfo);

      expect(result).toHaveProperty('zone', ticketDetailInfo.zone);
    });
  });

  describe('getTicketsDetail', () => {
    it('should retrieve tickets detail info', async () => {
      const { id: userId } = await userFactory.make();
      const { id: eventId } = await eventFactory.make({ userId });
      const { id } = await ticketsDetailFactory.make({ eventId });

      const result = await service.getTicketsDetail(id);

      expect(result).toHaveProperty('zone');
    });
  });

  describe('updateTicketsDetail', () => {
    it('should update tickets detail for an event', async () => {
      const { id: userId } = await userFactory.make();
      const { id: eventId } = await eventFactory.make({ userId });
      const { id } = await ticketsDetailFactory.make({
        eventId,
      });

      const price = faker.datatype.number();
      const result = await service.updateTicketsDetail(id, {
        eventId,
        nominalPrice: price,
      });

      expect(result).toHaveProperty('nominalPrice', price);
    });
  });

  describe('deleteTicketsDetail', () => {
    it('should delete tickets detail for an event', async () => {
      const { id: userId } = await userFactory.make();
      const { id: eventId } = await eventFactory.make({ userId });
      const { id } = await ticketsDetailFactory.make({
        eventId,
      });

      const result = await service.deleteTicketsDetail(id);

      expect(result.deletedAt).not.toEqual(null);
    });
  });

  describe('getTickets', () => {
    it('should retrieve tickets', async () => {
      const { id: userId } = await userFactory.make();
      const { id: eventId } = await eventFactory.make({ userId });
      const { id: orderId } = await orderFactory.make({
        userId,
        status: 'CART',
      });
      const { id: ticketsDetailId } = await ticketsDetailFactory.make({
        eventId,
      });
      await ticketFactory.make({ ticketsDetailId, orderId, eventId });

      const result = await service.getTickets(eventId);

      expect(result).toHaveProperty('length');
      if (result.length) {
        expect(result[0]).toHaveProperty('finalPrice');
      }
    });
  });

  describe('likeOrDislikeEvent', () => {
    it('should throw error if user not found', async () => {
      const { id: userId } = await userFactory.make();
      const eventId = faker.datatype.uuid();
      await expect(
        service.likeOrDislikeEvent(userId, eventId),
      ).rejects.toThrowError(new NotFoundException('Not found'));
    });

    it('should give a like if user has not liked event before', async () => {
      const { id: userId } = await userFactory.make();
      const { id: eventId } = await eventFactory.make({ userId });

      await service.likeOrDislikeEvent(userId, eventId);
      const result = await prisma.event.findUnique({
        where: {
          id: eventId,
        },
        select: {
          likes: {
            where: {
              id: userId,
            },
          },
        },
      });

      expect(result?.likes[0].id).toBe(userId);
    });

    it('should remove a like if user has liked event before', async () => {
      const { id: userId } = await userFactory.make();
      const { id: eventId } = await eventFactory.make({ userId });

      await service.likeOrDislikeEvent(userId, eventId);
      await service.likeOrDislikeEvent(userId, eventId);

      const result = await prisma.event.findUnique({
        where: {
          id: eventId,
        },
        select: {
          likes: {
            where: {
              id: userId,
            },
          },
        },
      });

      expect(result?.likes).toEqual(expect.arrayContaining([]));
    });
  });

  describe('getLikes', () => {
    it('should throw an error if event not found', async () => {
      const eventId = faker.datatype.uuid();

      await expect(service.getLikes(eventId)).rejects.toThrowError(
        new NotFoundException('Event not found'),
      );
    });

    it('should get likes given to event', async () => {
      const { id: userId } = await userFactory.make();
      const { id: eventId } = await eventFactory.make({ userId });
      await service.likeOrDislikeEvent(userId, eventId);

      const result = await service.getLikes(eventId);

      expect(result).toHaveLength(1);
      expect(result[0]).toHaveProperty('firstName');
    });
  });

  // describe('uploadImage', () => {
  //   it('should upload an image to an event', async () => {
  //     const { id: userId } = await userFactory.make();
  //     const { id: eventId } = await eventFactory.make({ userId });
  //     const imageUrl = await fetch(faker.image.abstract());
  //     const imageBuffer = Buffer.from(await imageUrl.arrayBuffer());
  //     const fileName = faker.word.noun();

  //     const readStream = new ReadStream();
  //     readStream.path = imageBuffer;

  //     const event = await service.uploadImage(eventId, readStream, fileName);

  //     expect(event).toHaveProperty('image');
  //     expect(event.image).toHaveProperty('url');
  //     expect(event.image).toHaveProperty('key');
  //   });
  // });
});
