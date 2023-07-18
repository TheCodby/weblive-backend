import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RequestWithUser, User } from '../interfaces/user';
import { RoomGateway } from './room.gateway';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roomGateway: RoomGateway,
  ) {}
  private readonly MAX_ROOMS_PER_PAGE = 10;
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
      return {
        rooms,
        pages,
      };
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
  async findOne(id: number, user: User) {
    try {
      const room = await this.prisma.room.findUniqueOrThrow({
        where: {
          id,
        },
      });
      const userJoined = await this.prisma.userRoom.findFirst({
        where: {
          userId: user.id,
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
    } catch (e: any) {
      if (e.code === 'P2025') {
        throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
      } else if (e.code === 'P2002') {
        throw new HttpException(
          'Room name already exists',
          HttpStatus.BAD_REQUEST,
        );
      }
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
      if (this.roomGateway.server) {
        this.roomGateway.roomDeleted(id.toString());
      }
      return {
        message: 'Room deleted successfully',
      };
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
}
