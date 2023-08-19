import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from '../guards/auth.guard';
import { PrismaModule } from '../database/prisma.module';
import { PrismaService } from '../database/prisma.service';
import { UserAuthDto } from './dto/user-auth.dto';
import { randomBytes } from 'crypto';
import { RegisterDto } from './dto/register.dto';
import { Response } from 'express';
import { OauthModule } from './oauth/oauth.module';
import { UtilsModule } from '../utils/utils.module';
import { HttpException, HttpStatus } from '@nestjs/common';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  const userTestName = randomBytes(10).toString('hex');
  const userTestEmail = randomBytes(10).toString('hex') + '@test.com';
  const mockResponse = {
    cookie: jest.fn().mockReturnThis(), // Chainable
    send: jest.fn().mockReturnThis(), // Chainable
  } as unknown as Response;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule,
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: '1d' },
        }),
        OauthModule,
        UtilsModule,
      ],
      providers: [AuthService],
    })
      .overrideGuard(AuthGuard)
      .useValue(AuthGuard)
      .compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });
  describe('Signup', () => {
    it('should register a user successfully', async () => {
      const mockRegisterDto: RegisterDto = {
        username: userTestName,
        email: userTestEmail,
        locale: 'en',
        password: 'test',
      };
      const registerResponse = await service.create(mockRegisterDto);
      expect(registerResponse).toBeDefined();
    });
    it('should fail to register if username already exists', async () => {
      const mockRegisterDto: RegisterDto = {
        username: userTestName,
        email: 'vdfdvfd@fsdfsfd.com',
        locale: 'en',
        password: 'test',
      };
      await expect(service.create(mockRegisterDto)).rejects.toThrow(
        new HttpException('Username already exists', HttpStatus.BAD_REQUEST),
      );
    });
    it('should fail to register if email already exists', async () => {
      const mockRegisterDto: RegisterDto = {
        username: 'testofgbgf44',
        email: userTestEmail,
        locale: 'en',
        password: 'test',
      };
      await expect(service.create(mockRegisterDto)).rejects.toThrow(
        new HttpException('Email already exists', HttpStatus.BAD_REQUEST),
      );
    });
  });
  describe('Login', () => {
    it('should fail to login with wrong password', async () => {
      const mockLoginDto: UserAuthDto = {
        username: userTestName,
        password: 'wrongPassword',
      };
      await expect(service.login(mockLoginDto, mockResponse)).rejects.toThrow(
        new HttpException(
          'Invalid username or password',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should login successfully with correct password', async () => {
      const mockLoginDto: UserAuthDto = {
        username: userTestName,
        password: 'test',
      };
      await service.login(mockLoginDto, mockResponse);
      expect(mockResponse.send).toHaveBeenCalledWith(
        expect.objectContaining({
          message: 'Successfully logged in',
        }),
      );
      expect(mockResponse.cookie).toHaveBeenCalledTimes(1);
    });
  });
  afterAll(async () => {
    await prisma.user.delete({
      where: {
        username: userTestName,
      },
    });
  });
});
