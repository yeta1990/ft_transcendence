import { Module } from '@nestjs/common';
import { Room } from './room.entity';
import { User } from '../user/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { HttpModule } from '@nestjs/axios';
import { HashService } from '../hash/hash.service';
import {UserModule} from '../user/user.module';
import { RoomService } from './room/room.service';

@Module({
	imports: [TypeOrmModule.forFeature([Room, User]), HttpModule, UserModule],
	exports: [ChatService],
	providers: [ChatService, HashService, RoomService]
})
export class ChatModule {

}
