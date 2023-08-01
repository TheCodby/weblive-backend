import { UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomAuthGuard } from '../guards/room-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { RoomOwnerGuard } from '../guards/room-owner.guard';
import { PrismaService } from '../database/prisma.service';
import { NotificationsUtil } from '../utils/notifications.util';
@WebSocketGateway({ cors: '*:*' })
@UseGuards(RoomAuthGuard)
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly notifications: NotificationsUtil,
  ) {}
  private onlineLiveRooms: Set<string> = new Set<string>();
  @WebSocketServer()
  server: Server;
  @SubscribeMessage('sendMessage')
  sendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() message: string,
  ): void {
    this.server.to(client.rooms.values().next().value).emit('message', {
      message: message,
      sender: client.handshake.query['username'],
      picture: client.handshake.query['picture'],
    });
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      client.leave(client.rooms.values().next().value); // remove from default room (socket.id)
      const roomId: string = client.handshake.query['roomId'] as string;
      const token = client.handshake.auth['token'];
      const user = await this.prisma.user.findUnique({
        where: { id: this.jwtService.verify(token)['id'] },
        select: { id: true, username: true, avatar: true },
      });
      client.handshake.query['userId'] = user.id.toString();
      client.handshake.query['username'] = user.username;
      client.handshake.query['picture'] = user.avatar;
      // remove user from room if already exists
      // loop sockets in room and check if user exists
      const sockets = this.server.sockets.adapter.rooms.get(roomId);
      if (sockets) {
        sockets.forEach((socketId: string) => {
          const socket = this.server.sockets.sockets.get(socketId);
          if (socket.handshake.query['userId'] === user.id.toString()) {
            socket.disconnect();
          }
        });
      }
      client.join(roomId);
      this.server.to(roomId).emit('joinedRoom', {
        picture: user.avatar,
        sender: user.username,
      });
    } catch (err) {
      client.disconnect();
    }
  }
  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.server.to(client.handshake.query['roomId']).emit('leftRoom', {
      senderId: client.handshake.query['userId'],
      sender: client.handshake.query['username'],
      picture: client.handshake.query['picture'],
    });
  }
  async getRoomOwner(
    @ConnectedSocket() client: Socket,
  ): Promise<Socket | false> {
    const roomId = client.handshake.query['roomId'] as string;
    const roomOwner = await this.prisma.room.findUnique({
      where: { id: parseInt(roomId) },
      select: { ownerId: true },
    });
    const sockets = this.server.sockets.adapter.rooms.get(roomId);
    if (sockets) {
      for (const socketId of sockets) {
        const socket = this.server.sockets.sockets.get(socketId);
        const userId = socket.handshake.query['userId'] as string;
        if (parseInt(userId) === roomOwner.ownerId) {
          return socket;
        }
      }
    }
    return false;
  }
  getUserInRoom(
    @ConnectedSocket() client: Socket,
    userId: string,
  ): Socket | false {
    const roomId = client.handshake.query['roomId'] as string;
    const sockets = this.server.sockets.adapter.rooms.get(roomId);
    if (sockets) {
      for (const socketId of sockets) {
        const socket = this.server.sockets.sockets.get(socketId);
        const socketUserId = socket.handshake.query['userId'] as string;
        if (socketUserId === userId) {
          return socket;
        }
      }
    }
    return false;
  }
  @UseGuards(RoomAuthGuard)
  @SubscribeMessage('receiveLive')
  async handleReceiveLive(@ConnectedSocket() client: Socket): Promise<void> {
    const roomId = client.handshake.query['roomId'] as string;
    const roomOwner = await this.getRoomOwner(client);
    if (!roomOwner || !this.onlineLiveRooms.has(roomId)) {
      client.emit('liveOffline');
      return;
    }
    roomOwner.emit('userRequestLive', client.handshake.query['userId']);
  }
  @UseGuards(RoomOwnerGuard)
  @SubscribeMessage('candidate')
  handleCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: any,
  ): void {
    const clientSocket = this.getUserInRoom(client, body.to);
    if (!clientSocket) return;
    clientSocket.emit('candidate', body.candidate);
  }
  @UseGuards(RoomOwnerGuard)
  @SubscribeMessage('live')
  handleLive(@ConnectedSocket() client: Socket): void {
    const roomId = client.handshake.query['roomId'] as string;
    if (this.onlineLiveRooms.has(roomId)) return;
    this.onlineLiveRooms.add(roomId);
    this.notifications.pushNotification(+client.handshake.query['userId'], {
      id: 0,
      type: 'live',
      message: 'Your live is now online',
      read: false,
      createdAt: new Date(),
    });
    this.server.to(client.handshake.query['roomId']).emit('liveStarted');
  }
  @UseGuards(RoomOwnerGuard)
  @SubscribeMessage('stopLive')
  handleStopLive(@ConnectedSocket() client: Socket): void {
    const roomId = client.handshake.query['roomId'] as string;
    this.onlineLiveRooms.delete(roomId);
    this.server.to(client.handshake.query['roomId']).emit('liveStopped');
  }
  @UseGuards(RoomOwnerGuard)
  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: any,
  ): void {
    const clientSocket = this.getUserInRoom(client, body.to);
    if (!clientSocket) return;
    clientSocket.emit('offer', body.offer);
  }
  @UseGuards(RoomAuthGuard)
  @SubscribeMessage('answer')
  async handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() answer: any,
  ): Promise<void> {
    const roomOwner = await this.getRoomOwner(client);
    if (!roomOwner) return;
    roomOwner.emit('answer', {
      body: answer,
      sender: client.handshake.query['userId'],
    });
  }
  // functions to handle room events (update, delete)
  getRoomsWithUserCounts(roomIds: string[]): { [roomId: string]: number } {
    const roomCounts = {};
    roomIds.forEach((roomId: string) => {
      roomCounts[roomId] = this.server.sockets.adapter.rooms.get(roomId)?.size;
    });

    return roomCounts;
  }
  roomUpdated(roomId: string): void {
    const room = this.server.sockets.adapter.rooms.get(roomId);
    if (room) {
      this.server.to(roomId).emit('roomUpdated');
    }
  }
  roomDeleted(roomId: string): void {
    const room = this.server.sockets.adapter.rooms.get(roomId);
    if (room) {
      this.server.to(roomId).emit('roomDeleted');
    }
  }
}
