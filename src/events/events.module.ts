import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendgridService } from 'src/auth/sendgrid.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UsersService } from 'src/users/users.service';
import { EventsResolver } from './events.resolver';
import { EventsService } from './events.service';

@Module({
  providers: [
    EventsResolver,
    EventsService,
    PrismaService,
    ConfigService,
    UsersService,
    SendgridService,
  ],
})
export class EventsModule {}
