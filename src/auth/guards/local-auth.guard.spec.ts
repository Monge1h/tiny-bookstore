import 'reflect-metadata'; // Asegúrate de que esto esté al principio
import { LocalAuthGuard } from './local-auth.guard';
import { ExecutionContext, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from '@nestjs/passport';

jest.mock('class-validator');

describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalAuthGuard,
        {
          provide: AuthGuard,
          useValue: jest.fn(),
        },
      ],
    }).compile();

    guard = module.get<LocalAuthGuard>(LocalAuthGuard);
  });

  it('should throw BadRequestException if validation fails', async () => {
    const context = createMockExecutionContext({ username: '', password: '' });
    const validationErrors = [
      {
        property: 'username',
        constraints: { isNotEmpty: 'username should not be empty' },
      },
      {
        property: 'password',
        constraints: { isNotEmpty: 'password should not be empty' },
      },
    ];

    (validate as jest.Mock).mockResolvedValue(validationErrors);

    await expect(guard.canActivate(context)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should call super.canActivate if validation passes', async () => {
    const context = createMockExecutionContext({
      username: 'testuser',
      password: 'testpass',
    });

    (validate as jest.Mock).mockResolvedValue([]);
    const superCanActivate = jest
      .spyOn(AuthGuard.prototype, 'canActivate')
      .mockResolvedValue(true);

    const result = await guard.canActivate(context);

    expect(superCanActivate).toHaveBeenCalledWith(context);
    expect(result).toBe(true);
  });

  function createMockExecutionContext(body: any) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          body,
        }),
      }),
    } as unknown as ExecutionContext;
  }
});
