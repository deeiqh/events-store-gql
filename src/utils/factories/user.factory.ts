import { faker } from '@faker-js/faker';
import { Inject } from '@nestjs/common';
import { Prisma, User, UserRole } from '@prisma/client';
import { hashSync } from 'bcryptjs';
import { PrismaService } from 'src/prisma/prisma.service';
import { Factory } from './abstract.factory';

export class UserFactory extends Factory<User> {
  @Inject(PrismaService)
  private prisma: PrismaService;

  async make(input: Partial<Prisma.UserCreateInput> = {}): Promise<User> {
    return this.prisma.user.create({
      data: {
        firstName: input.firstName ?? faker.name.firstName(),
        lastName: input.lastName ?? faker.name.lastName(),
        email: input.email ?? faker.internet.email(),
        password: hashSync(input.password ?? faker.internet.password()),
        role: input.role ?? UserRole.CLIENT,
      },
    });
  }

  async makeMany(fibonacci: number): Promise<User[]> {
    return Promise.all(Array(fibonacci).map(() => this.make()));
  }
}
