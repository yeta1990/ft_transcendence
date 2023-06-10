import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatGateway } from './chat.gateway';
import { User } from '../user/user.entity';
import { GameGateway } from './game.gateway';
import { BaseGateway } from './base.gateway';
import { ChatService } from '../chat/chat.service';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from '../chat/room.entity';
import { HashService } from '../hash/hash.service';
import {UserModule} from '../user/user.module';

@Module({
	imports: [TypeOrmModule.forFeature([Room, User]), AuthModule, HttpModule, UserModule],
  providers: [ChatService, ChatGateway, GameGateway, BaseGateway, HashService]
})

export class EventsModule {}
