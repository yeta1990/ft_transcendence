import { Module } from '@nestjs/common';
import { Room } from './room.entity';
import { User } from '../user/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { HttpModule } from '@nestjs/axios';
import { HashService } from '../hash/hash.service';
import {UserModule} from '../user/user.module';
import { RoomService } from './room/room.service';
import { ChatMessageService } from './chat-message/chat-message.service';
import { ChatMessage } from './chat-message/chat-message.entity';

@Module({
	imports: [TypeOrmModule.forFeature([Room, User, ChatMessage]), HttpModule, UserModule],
	exports: [RoomService, ChatService],
	providers: [ChatService, HashService, RoomService, ChatMessageService]
})
export class ChatModule {

}
