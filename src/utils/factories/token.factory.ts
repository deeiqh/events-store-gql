import { Injectable } from '@nestjs/common';
import { Prisma, Token } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { Factory } from './abstract.factory';

@Injectable()
export class TokenFactory extends Factory<Token> {
  constructor(private readonly prisma: PrismaService) {
    super();
  }
  async make(input: Prisma.TokenCreateInput): Promise<Token> {
    return this.prisma.token.create({
      data: {
        ...input,
      },
    });
  }

  async makeMany(
    fibonacci: number,
    input: Prisma.TokenCreateInput,
  ): Promise<Token[]> {
    return Promise.all(Array(fibonacci).map(() => this.make(input)));
  }
}
