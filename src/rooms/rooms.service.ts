import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { IUser } from '../interfaces/user';
import { RoomGateway } from './room.gateway';
import { PrismaService } from '../database/prisma.service';
import { UserUtil } from '../utils/user.util';
import CustomLoggerService from '../logger/logger.service';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roomGateway: RoomGateway,
    private readonly users: UserUtil,
  ) {}
  private readonly MAX_ROOMS_PER_PAGE = 10;
  private readonly logger = new CustomLoggerService(RoomsService.name);
  async create(createRoomDto: CreateRoomDto, userId: number) {
    const { name, password, description, password_protected } = createRoomDto;
    const newRoom = await this.prisma.room.create({
      data: {
        name: name,
        password: password_protected ? password : null,
        description: description,
        type: password_protected && password !== '' ? 1 : 0,
        owner: {
          connect: {
            id: userId,
          },
        },
      },
    });
    return {
      message: 'Room created successfully',
      room: newRoom,
    };
  }

  async findAll(page: number) {
    const rooms = await this.prisma.room.findMany({
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
      take: this.MAX_ROOMS_PER_PAGE,
      skip: (page - 1) * this.MAX_ROOMS_PER_PAGE,
    });
    const pages = Math.ceil(
      (await this.prisma.room.count()) / this.MAX_ROOMS_PER_PAGE,
    );
    // If server is running, get online users in each room
    if (this.roomGateway.server) {
      const onlineUsersInRooms = this.roomGateway.getRoomsWithUserCounts(
        rooms.map((room) => room.id.toString()),
      );
      rooms.forEach((room) => {
        room['onlineUsers'] = onlineUsersInRooms[room.id.toString()] || 0;
      });
    }
    this.logger.log(`Done`);
    return {
      rooms,
      pages,
    };
  }
  async findOne(id: number, user: IUser) {
    if (!parseInt(id.toString())) {
      throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
    }
    const room = await this.prisma.room.findUniqueOrThrow({
      where: {
        id,
      },
      include: {
        owner: {
          select: {
            username: true,
            avatar: true,
          },
        },
      },
    });
    const follow = await this.users.isFollowing(user.id, room.ownerId);
    room.owner['isFollowing'] = !!follow;
    const userJoined = await this.prisma.userRoom.findFirst({
      where: {
        userId: user.id,
        roomId: id,
      },
    });
    if (!userJoined && room.type === 1) {
      return false;
    }
    return room;
  }
  async join(id: number, password: string, userId: number) {
    const room = await this.prisma.room.findUnique({
      where: {
        id: id,
      },
    });
    if (!room) {
      throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
    }
    if (room.type === 1 && room.password !== password) {
      throw new HttpException('Wrong password', HttpStatus.BAD_REQUEST);
    }
    const userRoom = await this.prisma.userRoom.findFirst({
      where: {
        userId: userId,
        roomId: id,
      },
    });
    if (userRoom) {
      throw new HttpException(
        'You have already joined this room',
        HttpStatus.BAD_REQUEST,
      );
    }
    await this.prisma.userRoom.create({
      data: {
        userId: userId,
        roomId: id,
      },
    });
    return {
      message: 'Joined room successfully',
    };
  }
  async update(id: number, updateRoomDto: UpdateRoomDto) {
    const room = await this.prisma.room.update({
      where: {
        id,
      },
      data: {
        name: updateRoomDto.name,
        description: updateRoomDto.description,
        password: updateRoomDto.password_protected
          ? updateRoomDto.password
          : null,

        type:
          // if password_protected is true and password is not empty, type = 1
          updateRoomDto.password_protected && updateRoomDto.password !== ''
            ? 1
            : 0,
      },
    });
    await this.prisma.userRoom.deleteMany({
      where: {
        roomId: id,
        NOT: {
          userId: room.ownerId,
        },
      },
    });

    if (this.roomGateway.server) {
      this.roomGateway.roomUpdated(id.toString());
    }
    return {
      message: 'Room updated successfully',
      room,
    };
  }
  async remove(id: number) {
    await this.prisma.room.delete({
      where: {
        id,
      },
    });
    if (this.roomGateway.server) {
      this.roomGateway.roomDeleted(id.toString());
    }
    return {
      message: 'Room deleted successfully',
    };
  }
}
