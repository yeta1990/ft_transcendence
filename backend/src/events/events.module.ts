import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ChatGateway } from './chat.gateway';
import { GameGateway } from './game.gateway';
import { BaseGateway } from './base.gateway';

@Module({
	imports: [AuthModule],
  providers: [ChatGateway, GameGateway, BaseGateway]
})

export class EventsModule {}
