import { Module, forwardRef } from '@nestjs/common';
import { PongService } from './pong.service';
import {ChatModule} from '../chat/chat.module'
import {EventsModule } from '../events/events.module'

@Module({
  providers: [],
  	exports: []
})
export class PongModule {}
