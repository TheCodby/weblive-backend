import { Request } from 'express';
import { PrismaService } from '../database/prisma.service';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { randomBytes } from 'crypto';
import { MailerUtil } from './mailer.util';
import { render } from '@react-email/render';
import Verification from '../email-templates/verification';

@Injectable()
export class UserUtil {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mailer: MailerUtil,
  ) {}
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
  async sendVerificationEmail(userId: number) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
      });
      if (!user) {
        throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
      } else if (user.verified) {
        throw new HttpException(
          'Email is already verified',
          HttpStatus.BAD_REQUEST,
        );
      } else {
        const code = randomBytes(20).toString('hex');
        await this.prisma.user.update({
          where: {
            email: user.email,
          },
          data: {
            verificationCode: code,
          },
        });
        this.mailer.sendMail(
          user.email,
          'Verify your email',
          render(
            Verification({
              username: user.username,
              code: code,
            }),
          ),
        );
        return true;
      }
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
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
