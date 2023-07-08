import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Observable } from 'rxjs';
import { RequestWithUser } from '../interfaces/user';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request: RequestWithUser = context
      .switchToHttp()
      .getRequest<RequestWithUser>();
    if (!request.user.admin) return false;

    return true;
  }
}
