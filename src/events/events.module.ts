import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { EventsResolver } from './events.resolver';
import { EventsService } from './events.service';

@Module({
  providers: [EventsResolver, EventsService, PrismaService, ConfigService],
})
export class EventsModule {}
