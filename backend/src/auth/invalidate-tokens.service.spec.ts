import { Test, TestingModule } from '@nestjs/testing';
import { InvalidateTokensService } from './invalidate-tokens.service';

describe('InvalidateTokensService', () => {
  let service: InvalidateTokensService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InvalidateTokensService],
    }).compile();

    service = module.get<InvalidateTokensService>(InvalidateTokensService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
