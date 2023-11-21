import { TestBed } from '@angular/core/testing';

import { TwoFactorAuthServiceService } from './two-factor-auth-service.service';

describe('TwoFactorAuthServiceService', () => {
  let service: TwoFactorAuthServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TwoFactorAuthServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
