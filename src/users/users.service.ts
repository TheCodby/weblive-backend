import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}
  async getUserByUsername(requesterId: number, username: string) {
    const profile = await this.prisma.user.findUnique({
      where: {
        username: username,
      },
      select: {
        id: true,
        username: true,
        bio: true,
        avatar: true,
        created_at: true,
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
    const isFollowing = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: requesterId,
          followingId: profile.id,
        },
      },
    });
    if (!profile) throw new NotFoundException('User not found');
    return {
      ...profile,
      isFollowing: !!isFollowing,
    };
  }
  async followUser(followerId: number, userId: number) {
    if (followerId === userId)
      throw new NotFoundException('You cannot follow yourself');
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
