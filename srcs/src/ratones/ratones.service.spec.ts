import { Test, TestingModule } from '@nestjs/testing';
import { RatonesService } from './ratones.service';

describe('RatonesService', () => {
  let service: RatonesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RatonesService],
    }).compile();

    service = module.get<RatonesService>(RatonesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
