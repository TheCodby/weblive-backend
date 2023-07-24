import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserAuthDto } from './dto/user-auth.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt/dist';
import { User } from 'src/interfaces/user';
import Prisma from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { Request } from 'express';
import DiscordService from './oauth/discord.service';
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly discordService: DiscordService,
  ) {}
  private generateJwt(user: Prisma.User) {
    return this.jwtService.sign({
      id: user.id,
      username: user.username,
      picture: user.avatar,
      admin: user.admin,
    } as User);
  }
  async create(createAuthDto: UserAuthDto) {
    try {
      const salt = bcrypt.genSaltSync(5);
      const hashedPassword = await bcrypt.hash(createAuthDto.password, salt);
      await this.prisma.user.create({
        data: {
          username: createAuthDto.username,
          password: hashedPassword,
        },
      });
      return {
        message: 'Successfully created an account',
      };
    } catch (e) {
      if (e.code === 'P2002') {
        throw new HttpException(
          'Username already exists',
          HttpStatus.BAD_REQUEST,
        );
      } else {
        throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
      }
    }
  }
  async login(loginAuthDto: UserAuthDto) {
    const user = await this.prisma.user.findUnique({
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
      const token = this.generateJwt(user);
      return {
        message: 'Successfully logged in',
        user: {
          id: user.id,
          username: user.username,
          picture: user.avatar,
        },
        token: token,
      };
    }
  }
  async callback(req: Request) {
    const { code } = req.body;
    let user: Prisma.User;
    switch (req.params.provider) {
      case 'google':
        break;
      case 'discord':
        user = await this.discordService.login(code);
        break;
      default:
        throw new HttpException('Provider not found', HttpStatus.BAD_REQUEST);
    }
    if (!user)
      throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
    const token = this.generateJwt(user);
    return {
      message: 'Successfully logged in',
      user: {
        id: user.id,
        username: user.username,
        picture: user.avatar,
      },
      token: token,
    };
  }
}
