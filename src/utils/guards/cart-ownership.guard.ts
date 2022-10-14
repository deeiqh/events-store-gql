import {
  CanActivate,
  ExecutionContext,
  Inject,
  PreconditionFailedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { OrderStatus } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

export class CartOwnerShipGuard implements CanActivate {
  @Inject(PrismaService)
  private prisma: PrismaService;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);

    const userId = ctx.getContext().req.user;

    const order = await this.prisma.order.findMany({
      where: {
        userId,
        status: OrderStatus.CART,
        deletedAt: null,
      },
    });

    if (order.length > 1) {
      throw new PreconditionFailedException('More than one cart found');
    }

    if (order.length === 1) {
      return true;
    }

    return false;
  }
}
