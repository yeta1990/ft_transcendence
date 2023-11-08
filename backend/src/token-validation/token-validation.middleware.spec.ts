import { TokenValidationMiddleware } from './token-validation.middleware';

describe('TokenValidationMiddleware', () => {
  it('should be defined', () => {
    expect(new TokenValidationMiddleware()).toBeDefined();
  });
});
