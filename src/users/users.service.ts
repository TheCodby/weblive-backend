import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { UserUtil } from '../utils/user.util';

@Injectable()
export class UsersService {
  private readonly MAX_ROOMS_PER_PAGE = 10;
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UserUtil,
  ) {}

  async getUserProfile(requesterId: number, username: string) {
    if (!requesterId || !username) {
      throw new BadRequestException('Invalid input parameters');
    }
    const page = 1;
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        username: username,
      },
      select: {
        id: true,
        username: true,
        bio: true,
        public: true,
        avatar: true,
        rooms: {
          select: {
            id: true,
            name: true,
            capacity: true,
          },
          take: this.MAX_ROOMS_PER_PAGE,
          skip: (page - 1) * this.MAX_ROOMS_PER_PAGE,
        },
      },
    });
    if (!user.public && user.id !== requesterId) {
      // Check if user is public or if requester is the same user
      throw new ForbiddenException('User profile is private');
    }
    const followersCount = await this.users.getFollowersCount(user.id);
    const follow = await this.users.isFollowing(requesterId, user.id);
    if (!user) throw new NotFoundException('User not found');
    return {
      ...user,
      isFollowing: !!follow,
      followers: followersCount,
    };
  }
  async followUser(followerId: number, userId: number) {
    if (followerId === userId)
      throw new BadRequestException('You cannot follow yourself');
    await this.prisma.follow.create({
      data: {
        followerId: followerId,
        followingId: userId,
      },
    });
    return {
      message: `You are now following this user`,
    };
  }
  async unfollowUser(followerId: number, userId: number) {
    if (followerId === userId)
      throw new NotFoundException('You cannot unfollow yourself');
    await this.prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: followerId,
          followingId: userId,
        },
      },
    });
    return {
      message: `You are no longer following this user`,
    };
  }
}
