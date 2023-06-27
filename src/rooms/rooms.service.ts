import {
  BadGatewayException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { CreateRoomDto } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import prisma from '@/prisma';
import { RequestWithUser } from '../interfaces/user';

@Injectable()
export class RoomsService {
  async create(createRoomDto: CreateRoomDto, request: RequestWithUser) {
    try {
      const { roomName, roomPassword, roomDescription, passwordProtected } =
        createRoomDto;
      const newRoom = await prisma.room.create({
        data: {
          name: roomName,
          password: passwordProtected ? roomPassword : null,
          description: roomDescription,
          type: passwordProtected ? 1 : 0,
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

  findAll(page: number) {
    try {
      const rooms = prisma.room.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          type: true,
          capacity: true,
          owner: {
            select: {
              username: true,
            },
          },
        },
        take: 10,
        skip: (page - 1) * 10,
      });
      return rooms;
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  async findOne(id: number) {
    try {
      const room = await prisma.room.findUnique({
        where: {
          id,
        },
      });
      const userJoined = await prisma.userRoom.findFirst({
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
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  update(id: number, updateRoomDto: UpdateRoomDto) {
    return `This action updates a #${id} room`;
  }
  async join(id: string, password: string, request: RequestWithUser) {
    try {
      const room = await prisma.room.findUnique({
        where: {
          id: parseInt(id),
        },
      });
      if (!room) {
        throw new HttpException('Room not found', HttpStatus.NOT_FOUND);
      }
      if (room.type === 1 && room.password !== password) {
        throw new HttpException('Wrong password', HttpStatus.BAD_REQUEST);
      }
      const userRoom = await prisma.userRoom.findFirst({
        where: {
          userId: request.user.id,
          roomId: parseInt(id),
        },
      });
      if (userRoom) {
        throw new HttpException(
          'You have already joined this room',
          HttpStatus.BAD_REQUEST,
        );
      }
      await prisma.userRoom.create({
        data: {
          userId: request.user.id,
          roomId: parseInt(id),
        },
      });
      return {
        message: 'Joined room successfully',
      };
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
  remove(id: number) {
    return `This action removes a #${id} room`;
  }
}
