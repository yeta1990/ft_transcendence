import { Module } from '@nestjs/common';
import { Room } from './room.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatService } from './chat.service';

@Module({
	imports: [TypeOrmModule.forFeature([Room])],
	providers: [ChatService]

})
export class ChatModule {

}
