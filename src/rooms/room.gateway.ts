import { Query, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';
import { WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { RoomAuthGuard } from '../utils/guards/room-auth.guard';
import { JwtService } from '@nestjs/jwt';
@WebSocketGateway({ cors: '*:*' })
@UseGuards(RoomAuthGuard)
export class RoomGateway implements OnGatewayConnection {
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
      const roomId = client.handshake.query['roomId'];
      const token = client.handshake.auth['token'];
      const user = this.jwtService.verify(token);
      client.handshake.query['username'] = user.username;
      client.handshake.query['picture'] = user.picture;
      client.join(roomId);
      this.server.to(roomId).emit('joinedRoom', {
        picture: user.picture,
        sender: user.username,
      });
    } catch (err) {
      console.log(err);
    }
  }
}
