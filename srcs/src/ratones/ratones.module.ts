import { Module } from '@nestjs/common';
import { RatonesController } from './ratones.controller';
import { RatonesService } from './ratones.service';

@Module({
  controllers: [RatonesController],
  providers: [RatonesService]
})
export class RatonesModule {}
