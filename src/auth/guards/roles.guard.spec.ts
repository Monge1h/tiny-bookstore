import { RolesGuard } from './roles.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('should allow access if user has the required role (MANAGER)', () => {
    const context = createMockExecutionContext({ role: Role.MANAGER });
    jest.spyOn(reflector, 'get').mockReturnValue([Role.MANAGER]);

    const result = guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should deny access if user does not have the required role', () => {
    const context = createMockExecutionContext({ role: Role.CLIENT });
    jest.spyOn(reflector, 'get').mockReturnValue([Role.MANAGER]);

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  function createMockExecutionContext(user: any) {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
    } as unknown as ExecutionContext;
  }
});
