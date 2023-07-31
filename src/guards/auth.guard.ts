import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt/dist';
import { UserUtil } from '../utils/user.util';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly users: UserUtil,
  ) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.users.extractTokenFromHeader(request);
    try {
      const isLoggedin = this.jwtService.verify(token);
      request.user = isLoggedin;
      return isLoggedin;
    } catch (e) {
      throw new UnauthorizedException("You're not logged in");
    }
  }
}
