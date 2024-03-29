import { Module, forwardRef } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatGateway } from './chat.gateway';
import { User } from '../user/user.entity';
import { ChatMessage } from '../chat/chat-message/chat-message.entity';
import { ChatMessageService } from '../chat/chat-message/chat-message.service';
import { GameGateway } from './game.gateway';
import { ChatService } from '../chat/chat.service';
import { RoomService } from '../chat/room/room.service';
import { HttpModule } from '@nestjs/axios';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Room } from '../chat/room.entity';
import { Game } from '../pong/game.entity';
import { HashService } from '../hash/hash.service';
import { UserModule } from '../user/user.module';
import { PongService } from 'src/pong/pong.service';
import { PongModule } from 'src/pong/pong.module';
import { ChatAdminService } from '../chat/chat-admin/chat-admin.service'

@Module({
	imports: [TypeOrmModule.forFeature([Room, User, ChatMessage, Game]), forwardRef(() =>AuthModule), HttpModule, forwardRef(()=>UserModule)],
  	providers: [ChatGateway, ChatService, ChatAdminService, RoomService, ChatMessageService, GameGateway, HashService, PongService ],
  	exports: [ChatGateway]

})

export class EventsModule {}
