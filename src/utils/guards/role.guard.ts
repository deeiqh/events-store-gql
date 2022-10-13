import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const role = this.reflector.get<string>('role', ctx.getHandler());
    if (!role) {
      return true;
    }

    const req = ctx.getContext().req;
    const userId = req.user;

    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      select: {
        role: true,
      },
    });

    return role === user.role;
  }
}
