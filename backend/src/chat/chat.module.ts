import { Module, forwardRef } from '@nestjs/common';
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
import { ChatAdminService } from './chat-admin/chat-admin.service';
import { BaseGateway } from '../events/base.gateway'
import {EventsModule} from '../events/events.module'
import {AuthService} from '../auth/auth.service'
import {PongService} from '../pong/pong.service'
import {Game} from '../pong/game.entity'

@Module({
	
	imports: [TypeOrmModule.forFeature([Room, User, ChatMessage, Game]), HttpModule, forwardRef(() => UserModule), EventsModule],
	exports: [RoomService, ChatService, PongService ],
	providers: [BaseGateway, ChatService, PongService, HashService, RoomService, ChatMessageService, ChatAdminService, AuthService]
})
export class ChatModule {

}
