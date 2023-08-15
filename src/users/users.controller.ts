import { Controller, Get, Post, Param, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '../guards/auth.guard';
import { RequestWithUser } from '../interfaces/user';

@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}
  @Get(':username')
  async getUserProfile(
    @Param('username') username: string,
    @Req() req: RequestWithUser,
  ) {
    return await this.usersService.getUserProfile(+req.user.id, username);
  }

  @Post(':userId/follow')
  async followUser(
    @Param('userId') userId: number,
    @Req() req: RequestWithUser,
  ) {
    return await this.usersService.followUser(req.user.id, +userId);
  }
  @Post(':userId/unfollow')
  async unfollowUser(
    @Param('userId') userId: number,
    @Req() req: RequestWithUser,
  ) {
    return await this.usersService.unfollowUser(req.user.id, +userId);
  }
}
