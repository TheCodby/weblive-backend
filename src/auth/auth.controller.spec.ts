import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { AuthGuard } from '../guards/auth.guard';
import { PrismaModule } from '../database/prisma.module';
import { PrismaService } from '../database/prisma.service';
import { RequestWithUser } from '../interfaces/user';
import { UserAuthDto } from './dto/user-auth.dto';
import { randomBytes } from 'crypto';

describe('AuthController', () => {
  let controller: AuthController;
  let prisma: PrismaService;
  let mockRequest = <RequestWithUser>{};
  const userTestName = randomBytes(10).toString('hex');
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule,
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: '1d' },
        }),
      ],
      controllers: [AuthController],
      providers: [AuthService],
    })
      .overrideGuard(AuthGuard)
      .useValue(AuthGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    prisma = module.get<PrismaService>(PrismaService);
    const user = await prisma.user.findUnique({
      where: {
        id: 1,
      },
    });
    mockRequest = <RequestWithUser>{
      user: {
        id: user.id,
        username: user.username,
      },
    };
  });

  it('POST /auth/register - Register endpoint is working well', async () => {
    const mockRegisterDto: UserAuthDto = {
      username: userTestName,
      password: 'test',
    };
    const registerResponse = await controller.createAccount(mockRegisterDto);
    expect(registerResponse).toBeDefined();
  });
  it('POST /auth/login - Login endpoint is working well', async () => {
    const mockLoginDto: UserAuthDto = {
      username: userTestName,
      password: 'test',
    };
    const loginResponse = await controller.login(mockLoginDto);
    expect(loginResponse).toBeDefined();
    await prisma.user.delete({
      where: {
        username: userTestName,
      },
    });
  });
  it('POST /auth/login - try to login with wrong password', async () => {
    const mockLoginDto: UserAuthDto = {
      username: 'test',
      password: 'wrongPassword',
    };
    await expect(controller.login(mockLoginDto)).rejects.toThrow();
  });
});
