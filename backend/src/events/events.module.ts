import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatGateway } from './chat.gateway';
import { GameGateway } from './game.gateway';
import { BaseGateway } from './base.gateway';
import { ChatService } from '../chat/chat.service';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from '../chat/room.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Room]), AuthModule, HttpModule],
  providers: [ChatService, ChatGateway, GameGateway, BaseGateway]
})

export class EventsModule {}
