import { Test, TestingModule } from '@nestjs/testing';
import { RatonesController } from './ratones.controller';

describe('RatonesController', () => {
  let controller: RatonesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RatonesController],
    }).compile();

    controller = module.get<RatonesController>(RatonesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
