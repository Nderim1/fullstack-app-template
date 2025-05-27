import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: { sign: jest.fn() },
        },
        {
          provide: UserService,
          useValue: {
            findByEmail: jest.fn(),
            createUserInternal: jest.fn(),
            createMagicLink: jest.fn(),
            findByMagicLinkToken: jest.fn(),
            markMagicLinkAsUsed: jest.fn(),
            findById: jest.fn(),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key: string) => {
              if (key === 'JWT_SECRET') return 'test-secret';
              if (key === 'JWT_EXPIRES_IN') return '3600s';
              return null;
            }),
          },
        },
        {
          provide: EmailService,
          useValue: { sendMagicLinkEmail: jest.fn() },
        },
        { provide: PrismaService, useValue: {} }, // Basic mock for PrismaService
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // Add more specific tests here, for example:
  // describe('signUp', () => {
  //   it('should create a new user and return a JWT', async () => {
  //     // Mock userService.findByEmail to return null (user doesn't exist)
  //     // Mock userService.createUserInternal to return a user object
  //     // Mock jwtService.sign to return a token
  //     // Call service.signUp with mock data
  //     // Assert that the result contains the token and user
  //   });

  //   it('should throw ConflictException if user already exists', async () => {
  //     // Mock userService.findByEmail to return an existing user object
  //     // Expect service.signUp to throw ConflictException
  //   });
  // });
});
