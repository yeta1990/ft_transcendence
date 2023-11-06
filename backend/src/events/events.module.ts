import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatGateway } from './chat.gateway';
import { User } from '../user/user.entity';
import { ChatMessage } from '../chat/chat-message/chat-message.entity';
import { ChatMessageService } from '../chat/chat-message/chat-message.service';
import { GameGateway } from './game.gateway';
import { BaseGateway } from './base.gateway';
import { ChatService } from '../chat/chat.service';
import { RoomService } from '../chat/room/room.service';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from '../chat/room.entity';
import { HashService } from '../hash/hash.service';
import { UserModule } from '../user/user.module';
import { ChatAdminService } from '../chat/chat-admin/chat-admin.service'

@Module({
	imports: [TypeOrmModule.forFeature([Room, User, ChatMessage]), AuthModule, HttpModule, UserModule],
  	providers: [ChatService, ChatAdminService, RoomService, ChatMessageService, ChatGateway, GameGateway, BaseGateway, HashService]
})

export class EventsModule {}
