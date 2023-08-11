import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ChangePasswordDto } from './dto/ChangePassword.dto';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from './dto/UpdateProfile.dto';
import { randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { S3Util } from '../utils/s3.util';
import { NotificationsUtil } from '../utils/notifications.util';
import { UserUtil } from '../utils/user.util';
import { ChangeEmailDto } from './dto/ChangeEmail.dto';
import { OauthService, TOauthProviders } from '../auth/oauth/oauth.service';
import { TLocale } from '../types/main';
@Injectable()
export class MeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Util,
    private readonly notifications: NotificationsUtil,
    private readonly user: UserUtil,
    private readonly authProvider: OauthService,
  ) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
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
    return user;
  }
  async resendVerificationEmail(userId: number, language: TLocale) {
    try {
      this.user.sendVerificationEmail(userId, language);
      return {
        message: 'Successfully sent verification email',
      };
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
  async changePassword(changePasswordDto: ChangePasswordDto, userId: number) {
    try {
      const userCredentials = await this.prisma.credential.findUniqueOrThrow({
        where: {
          userId: userId,
        },
        select: {
          password: true,
        },
      });
      const currentPassword = changePasswordDto.currentPassword;
      const newPassword = changePasswordDto.newPassword;
      const matchedPassword = await bcrypt.compare(
        currentPassword,
        userCredentials.password,
      );
      if (!matchedPassword) {
        throw new HttpException(
          'Current password is incorrect',
          HttpStatus.BAD_REQUEST,
        );
      }
      const salt = bcrypt.genSaltSync(5);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      await this.prisma.credential.update({
        where: {
          userId: userId,
        },
        data: {
          password: hashedPassword,
        },
      });
      return {
        message: 'Successfully changed password',
      };
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
  async updateProfile(updateProfileDto: UpdateProfileDto, userId: number) {
    try {
      await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          ...updateProfileDto,
        },
      });

      return {
        message: 'Successfully updated profile',
      };
    } catch (e) {
      if (e.code === 'P2002') {
        throw new HttpException(
          'Username already exists',
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
  async updateProfilePicture(file: Express.Multer.File, userId: number) {
    const filename = randomUUID() + randomBytes(5).toString('hex') + '.jpg';
    await this.s3.uploadFile(
      'weblive-1',
      filename,
      file.buffer,
      'image/jpeg',
      'base64',
    );
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
      select: {
        avatar: true,
      },
    });
    const image_url = `https://weblive-1.s3.us-east-1.amazonaws.com/${filename}`;
    if (
      user.avatar?.startsWith('https://weblive-1.s3.us-east-1.amazonaws.com/')
    ) {
      const oldAvatarKey = user.avatar.replace(
        'https://weblive-1.s3.us-east-1.amazonaws.com/',
        '',
      );
      this.s3.removeFile('weblive-1', oldAvatarKey);
    }
    await this.prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        avatar: image_url,
      },
    });
    return {
      message: 'Successfully uploaded',
      image_url: image_url,
    };
  }
  async getNotifications(userId: number) {
    try {
      const notificationsNum = await this.notifications.getNotificationsNumber(
        userId,
      );
      return notificationsNum;
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
  async changeEmail(changePasswordDto: ChangeEmailDto, userId: number) {
    const email = changePasswordDto.email;
    try {
      await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          email: email,
          verified: false,
        },
      });
      this.user.sendVerificationEmail(userId);
      return {
        message: 'Successfully changed email, please verify your email',
      };
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
  async readNotifications(userId: number) {
    try {
      const notifications = await this.notifications.getNotifications(userId);
      await this.notifications.clearNotifications(userId);
      return notifications;
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
  async connect(
    provider: TOauthProviders,
    code: string,
    language: string,
    loggedinId?: number,
  ) {
    const user = await this.authProvider.login(
      provider,
      code,
      `${process.env.ORIGIN}/${language}/oauth/connect/${provider}`,
      loggedinId,
    );
    if (!user) {
      throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
    }
    return {
      message: 'Successfully connected',
    };
  }
}
