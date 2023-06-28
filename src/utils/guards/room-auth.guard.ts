import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RoomAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
  canActivate(context: ExecutionContext): boolean {
    const token = context.switchToWs().getClient().handshake.auth['token'];
    if (!token) return false;
    const user = this.jwtService.verify(token);
    return user;
  }
}
