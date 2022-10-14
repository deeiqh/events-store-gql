import {
  CanActivate,
  ExecutionContext,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma/prisma.service';

export class OrderOwnershipGuard implements CanActivate {
  @Inject(PrismaService)
  private prisma: PrismaService;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);

    const userId = ctx.getContext().req.user;
    const orderId = ctx.getArgs().orderId ?? ctx.getArgs().input.orderId;

    const order = await this.prisma.order.findUnique({
      where: {
        id: orderId,
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.userId === userId) {
      return true;
    }

    return false;
  }
}
