import { Test, TestingModule } from '@nestjs/testing';
import { EditProfileService } from './edit-profile.service';

describe('EditProfileService', () => {
  let service: EditProfileService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EditProfileService],
    }).compile();

    service = module.get<EditProfileService>(EditProfileService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
