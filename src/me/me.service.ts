import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ChangePasswordDto } from './dto/ChangePassword.dto';
import * as bcrypt from 'bcrypt';
import { RequestWithUser } from 'src/interfaces/user';
import prisma from '@/prisma';
import { UpdateProfileDto } from './dto/UpdateProfile.dto';
import { randomBytes, randomUUID } from 'crypto';
import { s3Client } from '../utils/aws-s3';
import { PutObjectCommand } from '@aws-sdk/client-s3';
@Injectable()
export class MeService {
  async getProfile(request: RequestWithUser) {
    const user = await prisma.user.findUnique({
      where: {
        id: request.user.id,
      },
      select: {
        id: true,
        username: true,
        bio: true,
        avatar: true,
        created_at: true,
      },
    });
    return user;
  }
  async changePassword(
    changePasswordDto: ChangePasswordDto,
    request: RequestWithUser,
  ) {
    try {
      const userData = await prisma.user.findUnique({
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
      await prisma.user.update({
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
      await prisma.user.update({
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
    await s3Client.send(
      new PutObjectCommand({
        Bucket: 'weblive-1',
        Key: filename,
        Body: file.buffer,
        ContentEncoding: 'base64',
        ContentType: 'image/jpeg',
      }),
    );
    await prisma.user.update({
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
}
