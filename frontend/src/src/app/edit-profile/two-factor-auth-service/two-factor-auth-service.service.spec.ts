import { TestBed } from '@angular/core/testing';

import { TwoFactorAuthService } from './two-factor-auth-service.service';

describe('TwoFactorAuthService', () => {
  let service: TwoFactorAuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TwoFactorAuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
