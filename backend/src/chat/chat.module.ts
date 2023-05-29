import { Module } from '@nestjs/common';
import { Room } from './room.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { HttpModule } from '@nestjs/axios';
import { HashService } from '../hash/hash.service';

@Module({
	imports: [TypeOrmModule.forFeature([Room]), HttpModule],
	exports: [ChatService],
	providers: [ChatService, HashService]
})
export class ChatModule {

}
