import {
  Injectable,
  PreconditionFailedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { OrderStatus, Prisma, TicketStatus } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { PrismaService } from 'src/prisma/prisma.service';
import { PrismaErrors } from 'src/utils/enums/prisma-errors.enum';
import { UpdateUserInput } from './dto/update-user.input';
import { User } from './entities/user.entity';
import { Order } from 'src/events/entities/order.entity';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  // async getUser(id: string) {
  //   const user = new User();
  //   user.id = id;
  //   return user;
  // }

  // async updateUser(id: string, updateUserInput: UpdateUserInput) {
  //   const user = new User();
  //   user.id = id;
  //   user.firstName = updateUserInput.firstName as string;
  //   return user;
  // }

  async getUser(userId: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
    return plainToInstance(User, user);
  }

  async updateUser(
    userId: string,
    updateUserInput: UpdateUserInput,
  ): Promise<User> {
    try {
      const user = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          ...updateUserInput,
        },
      });
      return plainToInstance(User, user);
    } catch (error) {
      throw new UnprocessableEntityException('Email already exists');
    }
  }

  async getCart(userId: string): Promise<Order> {
    const cart = await this.prisma.order.findMany({
      where: {
        userId,
        status: OrderStatus.CART,
        deletedAt: null,
        tickets: {
          some: {
            deletedAt: null,
            status: TicketStatus.RESERVED,
          },
        },
      },
    });

    if (cart.length > 1) {
      throw new PreconditionFailedException('More than one cart found');
    }

    if (!cart.length) {
      return plainToInstance(Order, {});
    }

    return plainToInstance(Order, cart[0]);
  }
}
