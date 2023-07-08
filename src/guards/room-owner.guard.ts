import { PrismaService } from '../database/prisma.service';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class RoomOwnerGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    let roomId: number;
    let userId: number;
    // check if the request is coming from a websocket or http request
    if (context.getType() === 'ws') {
      userId = +context.switchToWs().getClient().handshake.query['userId'];
      roomId = +context.switchToWs().getClient().handshake.query['roomId'];
    } else if (context.getType() === 'http') {
      userId = +context.switchToHttp().getRequest().user.id;
      roomId = +context.switchToHttp().getRequest().params.id;
    }
    const roomOwner = await this.prisma.room.findFirstOrThrow({
      where: { id: roomId, ownerId: userId },
    });
    return roomOwner ? true : false;
  }
}
