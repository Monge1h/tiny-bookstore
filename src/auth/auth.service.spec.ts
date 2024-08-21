import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { Role } from '@prisma/client';

describe('AuthService', () => {
  let authService: AuthService;
  let databaseService: DatabaseService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DatabaseService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
            },
            session: {
              create: jest.fn(),
              findUnique: jest.fn(),
              delete: jest.fn(),
            },
            refreshToken: {
              create: jest.fn(),
            },
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            decode: jest.fn(),
          },
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    databaseService = module.get<DatabaseService>(DatabaseService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('validateUser', () => {
    it('should validate and return the user data without password', async () => {
      const email = 'test@example.com';
      const password = 'password';
      const hashedPassword: string = await bcrypt.hash(password, 10);
      const mockUser = {
        id: 'user-id-1',
        email,
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        role: Role.CLIENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(databaseService.user, 'findUnique')
        .mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const result = await authService.validateUser(email, password);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { password: _, ...expectedUser } = mockUser;
      expect(result).toEqual(expectedUser);
      expect(databaseService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
    });

    it('should throw UnauthorizedException when credentials are invalid', async () => {
      jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(null);

      await expect(
        authService.validateUser('invalid@example.com', 'wrongpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('signUp', () => {
    it('should successfully register a new user', async () => {
      const signUpDto = {
        email: 'newuser@example.com',
        password: 'password',
        firstName: 'First',
        lastName: 'Last',
      };

      jest.spyOn(databaseService.user, 'findUnique').mockResolvedValue(null);
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedPassword');
      jest.spyOn(databaseService.user, 'create').mockResolvedValue({
        id: '1',
        email: signUpDto.email,
        password: 'hashedPassword',
        firstName: signUpDto.firstName,
        lastName: signUpDto.lastName,
        role: 'CLIENT',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      jest.spyOn(jwtService, 'sign').mockReturnValue('signedToken');

      const result = await authService.signUp(signUpDto);
      expect(result).toEqual({
        message: 'User successfully registered',
        access_token: 'signedToken',
      });
      expect(databaseService.user.create).toHaveBeenCalledWith({
        data: {
          email: signUpDto.email,
          password: 'hashedPassword',
          firstName: signUpDto.firstName,
          lastName: signUpDto.lastName,
          role: 'CLIENT',
        },
      });
    });

    it('should throw ConflictException if email already exists', async () => {
      const signUpDto = {
        email: 'existing@example.com',
        password: 'password',
        firstName: 'First',
        lastName: 'Last',
      };

      const mockedUserConflict = {
        id: '1',
        email: signUpDto.email,
        password: 'hashedPassword',
        firstName: signUpDto.firstName,
        lastName: signUpDto.lastName,
        role: Role.CLIENT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest
        .spyOn(databaseService.user, 'findUnique')
        .mockResolvedValue(mockedUserConflict);

      await expect(authService.signUp(signUpDto)).rejects.toThrow(
        ConflictException,
      );
    });
  });

  describe('signOut', () => {
    it('should successfully sign out a user', async () => {
      const token = 'validToken';
      const mockSession = {
        id: 'sessionId',
        token,
        userId: 'userId',
        expiresAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      jest
        .spyOn(jwtService, 'decode')
        .mockReturnValue({ sub: 'userId' } as any);
      jest
        .spyOn(databaseService.session, 'findUnique')
        .mockResolvedValue(mockSession);

      const result = await authService.signOut(token);
      expect(result).toEqual({ message: 'Successfully signed out' });
      expect(databaseService.session.delete).toHaveBeenCalledWith({
        where: { id: mockSession.id },
      });
    });

    it('should throw UnauthorizedException if session not found', async () => {
      const token = 'invalidToken';
      jest
        .spyOn(jwtService, 'decode')
        .mockReturnValue({ sub: 'userId' } as any);
      jest.spyOn(databaseService.session, 'findUnique').mockResolvedValue(null);

      await expect(authService.signOut(token)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      jest.spyOn(jwtService, 'decode').mockReturnValue(null);

      await expect(authService.signOut('invalidToken')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
