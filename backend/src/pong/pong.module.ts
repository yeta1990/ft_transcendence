import { Module } from '@nestjs/common';
import { PongService } from './pong/pong.service';

@Module({
  providers: [PongService]
})
export class PongModule {}
