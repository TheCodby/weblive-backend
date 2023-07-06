import { Test, TestingModule } from '@nestjs/testing';
import { RoomsService } from './rooms.service';
import { RoomGateway } from './room.gateway';
import { JwtModule } from '@nestjs/jwt';
import { RoomsController } from './rooms.controller';
import { AuthGuard } from '../utils/guards/auth.guard';
import { PrismaModule } from '../database/prisma.module';
import { PrismaService } from '../database/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { RequestWithUser } from '../interfaces/user';
import { randomBytes } from 'crypto';
import { UpdateRoomDto } from './dto/update-room.dto';

describe('RoomController', () => {
  let controller: RoomsController;
  let service: RoomsService;
  let prisma: PrismaService;
  let testRoomId: number;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        PrismaModule,
        JwtModule.register({
          secret: process.env.JWT_SECRET,
          signOptions: { expiresIn: '1d' },
        }),
      ],
      controllers: [RoomsController],
      providers: [RoomsService, RoomGateway],
    })
      .overrideGuard(AuthGuard)
      .useValue(AuthGuard)
      .compile();

    service = module.get<RoomsService>(RoomsService);
    controller = module.get<RoomsController>(RoomsController);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('POST /rooms - Creating room endpoint is working well', async () => {
    const user = await prisma.user.findUnique({
      where: {
        id: 1,
      },
    });
    const mockRequest = <RequestWithUser>{
      user: {
        id: user.id,
        username: user.username,
      },
    };
    const roomName = randomBytes(10).toString('hex');
    const mockCreateRoomDto: CreateRoomDto = {
      name: roomName,
      password: 'test',
      description: 'test',
      password_protected: false,
    };
    const createdRoom = await controller.create(mockCreateRoomDto, mockRequest);
    expect(createdRoom).toBeDefined();
    testRoomId = createdRoom.room.id;
  });
  it('GET /rooms is working well', async () => {
    const rooms = await prisma.room.findMany({
      select: {
        id: true,
        name: true,
        description: true,
        type: true,
        capacity: true,
        owner: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
      take: 10,
    });
    expect(await controller.findAll()).toMatchObject(rooms);
  });
  it('GET /rooms/:id is working well', async () => {
    const room = await prisma.room.findUnique({
      where: {
        id: testRoomId,
      },
    });
    expect(await controller.findOne(testRoomId.toString())).toMatchObject(room);
  });
  it('PATCH /rooms/:id is working well', async () => {
    const roomName = randomBytes(10).toString('hex');
    const mockUpdateRoomDto: UpdateRoomDto = {
      name: roomName,
      password: 'test',
      description: 'test',
      password_protected: true,
    };
    expect(
      await controller.update(testRoomId.toString(), mockUpdateRoomDto),
    ).toBeDefined();
  });
  it('DELETE /rooms/:id is working well', async () => {
    expect(await controller.remove(testRoomId.toString())).toBeDefined();
  });
});
