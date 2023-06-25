import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserAuthDto } from './dto/user-auth.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt/dist';
import { User } from 'src/interfaces/user';
import prisma from '@/prisma';
@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}
  async create(createAuthDto: UserAuthDto) {
    try {
      const salt = bcrypt.genSaltSync(5);
      const hashedPassword = await bcrypt.hash(createAuthDto.password, salt);
      await prisma.user.create({
        data: {
          username: createAuthDto.username,
          password: hashedPassword,
        },
      });
      return {
        message: 'Successfully created an account',
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2002') {
          throw new HttpException(
            'Username already exists',
            HttpStatus.BAD_REQUEST,
          );
        }
      } else {
        throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
      }
    }
  }
  async login(loginAuthDto: UserAuthDto) {
    const user = await prisma.user.findUnique({
      where: {
        username: loginAuthDto.username,
      },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
    } else {
      const isPasswordValid = await bcrypt.compare(
        loginAuthDto.password,
        user.password,
      );
      if (!isPasswordValid) {
        throw new HttpException(
          'Invalid username or password',
          HttpStatus.BAD_REQUEST,
        );
      }
      const token = this.jwtService.sign({
        id: user.id,
        username: user.username,
      } as User);
      return {
        message: 'Successfully logged in',
        username: user.username,
        token: token,
      };
    }
  }
}
