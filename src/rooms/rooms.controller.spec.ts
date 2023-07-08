import { Test, TestingModule } from '@nestjs/testing';
import { RoomsService } from './rooms.service';
import { RoomGateway } from './room.gateway';
import { JwtModule } from '@nestjs/jwt';
import { RoomsController } from './rooms.controller';
import { AuthGuard } from '../guards/auth.guard';
import { PrismaModule } from '../database/prisma.module';
import { PrismaService } from '../database/prisma.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { RequestWithUser } from '../interfaces/user';
import { randomBytes } from 'crypto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { HttpException } from '@nestjs/common';

describe('RoomController', () => {
  let controller: RoomsController;
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
      controllers: [RoomsController],
      providers: [RoomsService, RoomGateway],
    })
      .overrideGuard(AuthGuard)
      .useValue(AuthGuard)
      .compile();

    controller = module.get<RoomsController>(RoomsController);
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

  it('POST /rooms - Creating room endpoint is working well', async () => {
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
  it('POST /rooms/:id/join - Joining a room with the correct password should be successful', async () => {
    const roomName = randomBytes(10).toString('hex');
    const password = 'test';
    const createRoomDto: CreateRoomDto = {
      name: roomName,
      password: password,
      description: 'test',
      password_protected: true,
    };
    const createdRoom = await controller.create(createRoomDto, mockRequest);
    testRoomId = createdRoom.room.id;

    // Join the room with the correct password
    const joinResponse = await controller.join(
      testRoomId.toString(),
      password,
      mockRequest,
    );

    expect(joinResponse.message).toBe('Joined room successfully');
  });

  it('POST /rooms/:id/join - Joining a room with the wrong password should throw an error', async () => {
    const roomName = randomBytes(10).toString('hex');
    const password = 'test';
    const createRoomDto: CreateRoomDto = {
      name: roomName,
      password: password,
      description: 'test',
      password_protected: true,
    };
    const createdRoom = await controller.create(createRoomDto, mockRequest);
    testRoomId = createdRoom.room.id;

    // Join the room with the wrong password
    const wrongPassword = 'wrong_password';
    await expect(
      controller.join(testRoomId.toString(), wrongPassword, mockRequest),
    ).rejects.toThrowError(HttpException);
  });

  it('GET /rooms - Retrieving all rooms should return paginated results', async () => {
    // Create more than 10 rooms to test pagination
    for (let i = 0; i < 15; i++) {
      const roomName = randomBytes(10).toString('hex');
      const createRoomDto: CreateRoomDto = {
        name: roomName,
        password: 'test',
        description: 'test',
        password_protected: false,
      };
      await controller.create(createRoomDto, mockRequest);
    }

    // Retrieve the first page of rooms
    const page = 1;
    const paginatedRooms = await controller.findAll(page);

    expect(paginatedRooms).toHaveLength(10); // Expecting 10 rooms per page
    expect(paginatedRooms[0].name).toBeDefined(); // Ensure the response contains the expected properties
  });

  it('PATCH /rooms/:id - Updating a room as the owner should be successful', async () => {
    // Create a room
    const roomName = randomBytes(10).toString('hex');
    const createRoomDto: CreateRoomDto = {
      name: roomName,
      password: 'test',
      description: 'test',
      password_protected: false,
    };
    const createdRoom = await controller.create(createRoomDto, mockRequest);
    testRoomId = createdRoom.room.id;

    // Update the room as the owner
    const updatedRoomName = randomBytes(10).toString('hex');
    const updateRoomDto: UpdateRoomDto = {
      name: updatedRoomName,
      password: 'new_password',
      description: 'new_description',
      password_protected: true,
    };
    const updateResponse = await controller.update(
      testRoomId.toString(),
      updateRoomDto,
    );

    expect(updateResponse.message).toBe('Room updated successfully');
    expect(updateResponse.room.name).toBe(updatedRoomName);
  });

  it('DELETE /rooms/:id - Deleting a room as the owner should be successful', async () => {
    // Create a room
    const roomName = randomBytes(10).toString('hex');
    const createRoomDto: CreateRoomDto = {
      name: roomName,
      password: 'test',
      description: 'test',
      password_protected: false,
    };
    const createdRoom = await controller.create(createRoomDto, mockRequest);
    testRoomId = createdRoom.room.id;

    // Delete the room as the owner
    const deleteResponse = await controller.remove(testRoomId.toString());

    expect(deleteResponse.message).toBe('Room deleted successfully');
  });
});
