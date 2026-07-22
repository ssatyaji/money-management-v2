import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  it('should initialize correctly with secret in development mode', async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('my-dev-secret'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    const strategy = module.get<JwtStrategy>(JwtStrategy);
    expect(strategy).toBeDefined();
  });

  it('should throw Error when booting in production without JWT secret', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    const mockConfigService = {
      get: jest.fn().mockReturnValue(undefined),
    };

    expect(() => new JwtStrategy(mockConfigService as any)).toThrow(
      'JWT Access Secret must be configured in production environment',
    );

    process.env.NODE_ENV = originalEnv;
  });
});
