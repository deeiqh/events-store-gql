import { CanActivate, ExecutionContext, Inject } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PrismaService } from 'src/prisma/prisma.service';

export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  @Inject(PrismaService)
  private prisma: PrismaService;

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);

    const role = this.reflector.get<string>('role', ctx.getHandler());
    if (!role) {
      return true;
    }

    const req = ctx.switchToHttp().getRequest();
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
