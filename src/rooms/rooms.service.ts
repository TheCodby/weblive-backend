import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RequestWithUser } from '../interfaces/user';
import { RoomGateway } from './room.gateway';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roomGateway: RoomGateway,
  ) {}
  async create(createRoomDto: CreateRoomDto, request: RequestWithUser) {
    try {
      const { name, password, description, password_protected } = createRoomDto;
      const newRoom = await this.prisma.room.create({
        data: {
          name: name,
          password: password_protected ? password : null,
          description: description,
          type: password_protected ? 1 : 0,
          owner: {
            connect: {
              id: request.user.id,
            },
          },
        },
      });
      return {
        message: 'Room created successfully',
        room: newRoom,
      };
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  async findAll(page: number) {
    try {
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
        take: 10,
        skip: (page - 1) * 10,
      });
      // If server is running, get online users in each room
      if (this.roomGateway.server) {
        const onlineUsersInRooms = this.roomGateway.getRoomsWithUserCounts(
          rooms.map((room) => room.id.toString()),
        );
        rooms.forEach((room) => {
          room['onlineUsers'] = onlineUsersInRooms[room.id.toString()] || 0;
        });
      }
      return rooms;
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
  async findOne(id: number) {
    try {
      const room = await this.prisma.room.findUniqueOrThrow({
        where: {
          id,
        },
      });
      const userJoined = await this.prisma.userRoom.findFirst({
        where: {
          userId: 1,
          roomId: id,
        },
      });
      if (!userJoined && room.type === 1) {
        throw new HttpException(
          'You have not joined this room',
          HttpStatus.UNAUTHORIZED,
        );
      }
      return room;
    } catch (e: any) {
      console.log(e);
      if (e.code === 'P2025') {
        throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  async update(id: number, updateRoomDto: UpdateRoomDto) {
    try {
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

          type: updateRoomDto.password_protected ? 1 : 0,
        },
      });
      return {
        message: 'Room updated successfully',
        room,
      };
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
  async join(id: number, password: string, request: RequestWithUser) {
    try {
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
          userId: request.user.id,
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
          userId: request.user.id,
          roomId: id,
        },
      });
      return {
        message: 'Joined room successfully',
      };
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
  async remove(id: number) {
    try {
      await this.prisma.room.delete({
        where: {
          id,
        },
      });
      return {
        message: 'Room deleted successfully',
      };
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
}
