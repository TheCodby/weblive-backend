import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ChangePasswordDto } from './dto/ChangePassword.dto';
import * as bcrypt from 'bcrypt';
import { RequestWithUser } from 'src/interfaces/user';
import { UpdateProfileDto } from './dto/UpdateProfile.dto';
import { randomBytes, randomUUID } from 'crypto';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { PrismaService } from '../database/prisma.service';
import { CompleteAccountDto } from './dto/CompleteAccount.dto';
import { S3Util } from '../utils/s3.util';
@Injectable()
export class MeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly s3: S3Util,
  ) {}

  async getProfile(request: RequestWithUser) {
    let completed = true;
    const user = await this.prisma.user.findUnique({
      where: {
        id: request.user.id,
      },
      select: {
        id: true,
        username: true,
        password: true,
        bio: true,
        avatar: true,
        created_at: true,
        admin: true,
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
    if (user.password === null) {
      completed = false;
    }
    delete user.password;
    return {
      ...user,
      completed: completed,
    };
  }
  async changePassword(
    changePasswordDto: ChangePasswordDto,
    request: RequestWithUser,
  ) {
    try {
      const userData = await this.prisma.user.findUnique({
        where: {
          id: request.user.id,
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
          id: request.user.id,
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
  async updateProfile(
    updateProfileDto: UpdateProfileDto,
    request: RequestWithUser,
  ) {
    try {
      await this.prisma.user.update({
        where: {
          id: request.user.id,
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
  async updateProfilePicture(
    file: Express.Multer.File,
    request: RequestWithUser,
  ) {
    const filename = randomUUID() + randomBytes(5).toString('hex') + '.jpg';
    await this.s3.send(
      new PutObjectCommand({
        Bucket: 'weblive-1',
        Key: filename,
        Body: file.buffer,
        ContentEncoding: 'base64',
        ContentType: 'image/jpeg',
      }),
    );
    await this.prisma.user.update({
      where: {
        id: request.user.id,
      },
      data: {
        avatar: filename,
      },
    });
    return {
      message: 'Successfully uploaded',
      image_url: filename,
    };
  }
  async completeAccount(
    request: RequestWithUser,
    completeAccountInputs: CompleteAccountDto,
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: {
          id: request.user.id,
        },
        select: {
          password: true,
        },
      });
      if (user.password !== null) {
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
          id: request.user.id,
        },
        data: {
          password: hashedPassword,
        },
      });
      return {
        message: 'Successfully completed account',
      };
    } catch (e) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
}
