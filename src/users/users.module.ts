import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendgridService } from 'src/auth/sendgrid.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

@Module({
  providers: [
    UsersResolver,
    UsersService,
    PrismaService,
    SendgridService,
    ConfigService,
  ],
})
export class UsersModule {}
