import { Test, TestingModule } from '@nestjs/testing';
import { EditProfileController } from './edit-profile.controller';

describe('EditProfileController', () => {
  let controller: EditProfileController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EditProfileController],
    }).compile();

    controller = module.get<EditProfileController>(EditProfileController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
