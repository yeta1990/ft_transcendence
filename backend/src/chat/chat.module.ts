import { Module } from '@nestjs/common';
import { Room } from './room.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';
import { HttpModule } from '@nestjs/axios';

@Module({
	imports: [TypeOrmModule.forFeature([Room]), HttpModule],
	exports: [ChatService],
	providers: [ChatService]
})
export class ChatModule {

}
