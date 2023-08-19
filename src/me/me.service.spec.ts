import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../database/prisma.service';
import { MeService } from './me.service';
import { UtilsModule } from '../utils/utils.module';
import { OauthModule } from '../auth/oauth/oauth.module';
import { User } from '@prisma/client';
import { ChangePasswordDto } from './dto/ChangePassword.dto';
import * as bcrypt from 'bcrypt';

describe('MeService', () => {
  let service: MeService;
  let prisma: PrismaService;
  let user: User;
  const currentPassword = 'testPassword';
  const email = 'thecodby@gmail.com';
  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [UtilsModule, OauthModule],
      providers: [MeService, PrismaService /*, Other dependencies */],
    }).compile();

    service = module.get<MeService>(MeService);
    prisma = module.get<PrismaService>(PrismaService);
    user = await prisma.user.create({
      data: {
        username: 'testUser',
        email: email,
        credentials: {
          create: {
            password: await bcrypt.hash(currentPassword, 10),
          },
        },
      },
    });
  });
  it('should get user profile', async () => {
    const result = await service.getProfile(user.id);

    expect(result).toBeDefined();
  });
  it('should resend verification email', async () => {
    const result = await service.resendVerificationEmail(user.id, 'en');

    expect(result).toBeDefined();
  });
  it('should change password', async () => {
    const newPassword: ChangePasswordDto = {
      currentPassword: currentPassword,
      newPassword: 'newPassword',
      confirmPassword: 'newPassword',
    };
    const result = await service.changePassword(newPassword, user.id);

    expect(result).toBeDefined();
  });
  afterAll(async () => {
    await prisma.user.delete({
      where: {
        username: 'testUser',
      },
    });
  });
});
