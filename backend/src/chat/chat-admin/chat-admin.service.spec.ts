import { Test, TestingModule } from '@nestjs/testing';
import { ChatAdminService } from './chat-admin.service';

describe('ChatAdminService', () => {
  let service: ChatAdminService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ChatAdminService],
    }).compile();

    service = module.get<ChatAdminService>(ChatAdminService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
