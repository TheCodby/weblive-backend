import { Request } from 'express';
import { PrismaService } from '../database/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserUtil {
  constructor(private readonly prisma: PrismaService) {}
  async isFollowing(followerId: number, followingId: number) {
    const follow = await this.prisma.follow.findFirst({
      where: {
        followerId: followerId,
        followingId: followingId,
      },
    });
    return !!follow;
  }
  async getFollowersCount(userId: number) {
    const count = await this.prisma.follow.count({
      where: {
        followingId: userId,
      },
    });
    return count;
  }
  async getFollowersIds(userId: number): Promise<number[]> {
    const followers = await this.prisma.follow.findMany({
      where: {
        followingId: userId,
      },
      select: {
        followerId: true,
      },
    });
    return followers.map((follower) => follower.followerId);
  }
  extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
  generateRandomUsername(): string {
    const adjectives = [
      'happy',
      'angry',
      'crazy',
      'funny',
      'silly',
      'fierce',
      'brave',
      'shiny',
      'jolly',
      'clever',
      'witty',
      'awesome',
      'swift',
      'energetic',
      'kind',
      'gentle',
      'vivid',
      'vibrant',
      'magnificent',
    ];

    const nouns = [
      'tiger',
      'lion',
      'unicorn',
      'dragon',
      'eagle',
      'dolphin',
      'panda',
      'koala',
      'wolf',
      'fox',
      'rabbit',
      'hawk',
      'phoenix',
      'panther',
      'butterfly',
      'zebra',
      'octopus',
      'sparrow',
      'giraffe',
    ];

    const randomAdjective =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
    const randomNumber = Math.floor(Math.random() * 1000);

    return `${randomAdjective}-${randomNoun}-${randomNumber}`;
  }
}
