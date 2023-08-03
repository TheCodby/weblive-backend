import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserAuthDto } from './dto/user-auth.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt/dist';
import { User } from 'src/interfaces/user';
import Prisma from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { Request } from 'express';
import DiscordService from './oauth/discord.service';
import GoogleService from './oauth/google.service';
import { MailerUtil } from '../utils/mailer.util';
import { render } from '@react-email/render';
import Verification from '../email-templates/verification';
import { randomBytes } from 'crypto';
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
    private readonly discordService: DiscordService,
    private readonly googleService: GoogleService,
    private readonly mailer: MailerUtil,
  ) {}
  private generateJwt(user: Prisma.User) {
    return this.jwtService.sign({
      id: user.id,
      username: user.username,
      picture: user.avatar,
      admin: user.admin,
    } as User);
  }
  async create(createAuthDto: RegisterDto) {
    try {
      const salt = bcrypt.genSaltSync(5);
      const hashedPassword = await bcrypt.hash(createAuthDto.password, salt);
      await this.prisma.user.create({
        data: {
          username: createAuthDto.username,
          email: createAuthDto.email,
          password: hashedPassword,
        },
      });
      this.sendVerificationEmail(createAuthDto.email);
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
  async sendVerificationEmail(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
    } else {
      const code = randomBytes(20).toString('hex');
      await this.prisma.user.update({
        where: {
          email: email,
        },
        data: {
          verificationCode: code,
        },
      });
      this.mailer.sendMail(
        email,
        'Verify your email',
        render(
          Verification({
            code: code,
          }),
        ),
      );
      return {
        message: 'Successfully sent verification email',
      };
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
        user = await this.googleService.login(code);
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
