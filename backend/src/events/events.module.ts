import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { GameGateway } from './game.gateway';
import { BaseGateway } from './base.gateway';

@Module({
  providers: [ChatGateway, GameGateway, BaseGateway]
})

export class EventsModule {}
