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
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UserUtil,
  ) {}

  async getUserByUsername(requesterId: number, username: string) {
    if (!requesterId || !username) {
      throw new BadRequestException('Invalid input parameters');
    }
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        username: username,
      },
      include: {
        rooms: {
          select: {
            id: true,
            name: true,
            capacity: true,
            owner: {
              select: {
                username: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
    if (!user.public && user.id !== requesterId) {
      // Check if user is public or if requester is the same user
      throw new ForbiddenException('User profile is private');
    }
    const profile = this.prisma.exclude(user, [
      'email',
      'googleId',
      'discordId',
      'last_login',
    ]);
    const followersCount = await this.users.getFollowersCount(user.id);
    const follow = await this.users.isFollowing(requesterId, profile.id);
    if (!profile) throw new NotFoundException('User not found');
    return {
      ...profile,
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
