import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ChangePasswordDto } from './dto/ChangePassword.dto';
import * as bcrypt from 'bcrypt';
import { UpdateProfileDto } from './dto/UpdateProfile.dto';
import { randomBytes, randomUUID } from 'crypto';
import { PrismaService } from '../database/prisma.service';
import { CompleteAccountDto } from './dto/CompleteAccount.dto';
import { S3Util } from '../utils/s3.util';
import { NotificationsUtil } from '../utils/notifications.util';
import { UserUtil } from '../utils/user.util';
import { ChangeEmailDto } from './dto/ChangeEmail.dto';
@Injectable()
export class MeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Util,
    private readonly notifications: NotificationsUtil,
    private readonly user: UserUtil,
  ) {}

  async getProfile(userId: number) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },

      select: {
        id: true,
        username: true,
        email: true,
        bio: true,
        avatar: true,
        created_at: true,
        admin: true,
        verified: true,
        completed: true,
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
  async resendVerificationEmail(userId: number) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: {
        id: userId,
      },
    });
    if (user.id !== userId) {
      throw new HttpException(
        'You are not authorized to do this',
        HttpStatus.BAD_REQUEST,
      );
    }
    try {
      this.user.sendVerificationEmail(user.id);
      return {
        message: 'Successfully sent verification email',
      };
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
  async changePassword(changePasswordDto: ChangePasswordDto, userId: number) {
    try {
      const userData = await this.prisma.user.findUniqueOrThrow({
        where: {
          id: userId,
        },
        select: {
          password: true,
        },
      });
      const currentPassword = changePasswordDto.currentPassword;
      const newPassword = changePasswordDto.newPassword;
      const matchedPassword = await bcrypt.compare(
        currentPassword,
        userData.password,
      );
      if (!matchedPassword) {
        throw new HttpException(
          'Current password is incorrect',
          HttpStatus.BAD_REQUEST,
        );
      }
      const salt = bcrypt.genSaltSync(5);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      await this.prisma.user.update({
        where: {
          id: userId,
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
  async completeAccount(
    userId: number,
    completeAccountInputs: CompleteAccountDto,
  ) {
    try {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: {
          id: userId,
        },
        select: {
          completed: true,
        },
      });
      if (user.completed) {
        throw new HttpException(
          'Account already completed',
          HttpStatus.BAD_REQUEST,
        );
      }
      const salt = bcrypt.genSaltSync(5);
      const hashedPassword = await bcrypt.hash(
        completeAccountInputs.password,
        salt,
      );
      await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          password: hashedPassword,
          completed: true,
        },
      });
      return {
        message: 'Successfully completed account',
      };
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
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
}
