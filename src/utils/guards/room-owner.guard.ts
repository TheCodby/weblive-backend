import prisma from '@/prisma';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class RoomOwnerGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const userId = context.switchToWs().getClient().handshake.query['userId'];
    const roomId = context.switchToWs().getClient().handshake.query['roomId'];
    const roomOwner = await prisma.room.findUnique({
      where: { id: parseInt(roomId) },
      select: { ownerId: true },
    });
    if (roomOwner.ownerId !== userId) return false;
    return true;
  }
}
