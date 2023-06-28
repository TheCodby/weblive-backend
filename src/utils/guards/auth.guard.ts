import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt/dist';
import { extractTokenFromHeader } from 'src/utils/user';
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = extractTokenFromHeader(request);
    try {
      const isLoggedin = this.jwtService.verify(token);
      request.user = isLoggedin;
      return isLoggedin;
    } catch (e) {
      throw new UnauthorizedException("You're not logged in");
    }
  }
}
