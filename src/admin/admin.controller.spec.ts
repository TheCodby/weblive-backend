import { Test, TestingModule } from '@nestjs/testing';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaService } from '../database/prisma.service';
import { RequestWithUser } from '../interfaces/user';
import { PrismaModule } from '../database/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { AdminGuard } from '../guards/admin.guard';

describe('AdminController', () => {
  let controller: AdminController;
  let prisma: PrismaService;
  let testRoomId: number;
  let mockRequest = <RequestWithUser>{};
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule,
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: '1d' },
        }),
      ],
      controllers: [AdminController],
      providers: [AdminService],
    })
      .overrideGuard(AdminGuard)
      .useValue(AdminGuard)
      .compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
