import {
  CanActivate,
  ExecutionContext,
  Inject,
  NotFoundException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma/prisma.service';

export class EventOwnershipGuard implements CanActivate {
  @Inject(PrismaService)
  private prisma: PrismaService;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);

    const userId = ctx.getContext().req.user;
    const eventId = ctx.getArgs().eventId ?? ctx.getArgs().input.eventId;

    const event = await this.prisma.event.findUnique({
      where: {
        id: eventId,
      },
      select: {
        userId: true,
      },
    });

    if (!event) {
      throw new NotFoundException('Event not found');
    }

    if (event.userId === userId) {
      return true;
    }

    return false;
  }
}
