import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}
  async getUsers(page: number) {
    try {
      return await this.prisma.user.findMany({
        select: {
          id: true,
          username: true,
          admin: true,
        },
        skip: (page - 1) * 10,
        take: 10,
      });
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
  async deleteUser(id: number) {
    try {
      await this.prisma.user.delete({
        where: {
          id,
        },
      });
      return {
        message: 'Successfully deleted user',
      };
    } catch (e: any) {
      throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }
}
