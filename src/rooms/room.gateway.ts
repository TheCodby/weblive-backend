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
import { RoomAuthGuard } from '../utils/guards/room-auth.guard';
import { JwtService } from '@nestjs/jwt';
@WebSocketGateway({ cors: '*:*' })
@UseGuards(RoomAuthGuard)
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(private readonly jwtService: JwtService) {}
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

  handleConnection(@ConnectedSocket() client: Socket) {
    try {
      client.leave(client.rooms.values().next().value); // remove from default room (socket.id)
      const roomId: string = client.handshake.query['roomId'] as string;
      const token = client.handshake.auth['token'];
      const user = this.jwtService.verify(token);
      client.handshake.query['userId'] = user.id;
      client.handshake.query['username'] = user.username;
      client.handshake.query['picture'] = user.picture;
      // remove user from room if already exists
      // loop sockets in room and check if user exists
      const sockets = this.server.sockets.adapter.rooms.get(roomId);
      if (sockets) {
        sockets.forEach((socketId: string) => {
          const socket = this.server.sockets.sockets.get(socketId);
          if (socket.handshake.query['userId'] === user.id) {
            socket.disconnect();
          }
        });
      }
      client.join(roomId);
      this.server.to(roomId).emit('joinedRoom', {
        picture: user.picture,
        sender: user.username,
      });
    } catch (err) {
      console.log(err);
    }
  }
  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.server.to(client.handshake.query['roomId']).emit('leftRoom', {
      sender: client.handshake.query['username'],
      picture: client.handshake.query['picture'],
    });
  }
  getRoomsWithUserCounts(roomIds: string[]): { [roomId: string]: number } {
    const roomCounts = {};
    roomIds.forEach((roomId: string) => {
      roomCounts[roomId] = this.server.sockets.adapter.rooms.get(roomId)?.size;
    });

    return roomCounts;
  }
}
