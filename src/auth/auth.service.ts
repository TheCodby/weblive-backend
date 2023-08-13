import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { UserAuthDto } from './dto/user-auth.dto';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt/dist';
import { IUser } from 'src/interfaces/user';
import Prisma from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { UserUtil } from '../utils/user.util';
import { OauthService, TOauthProviders } from './oauth/oauth.service';
import { TLocale } from '../types/main';
import { Response } from 'express';
@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly authProvider: OauthService,
    private readonly userUtil: UserUtil,
    private readonly prisma: PrismaService,
  ) {}

  private generateJwt(user: Prisma.User) {
    return this.jwtService.sign({
      id: user.id,
      username: user.username,
      picture: user.avatar,
      admin: user.admin,
    } as IUser);
  }

  async create(createAuthDto: RegisterDto) {
    try {
      const salt = await bcrypt.genSalt(5);
      const hashedPassword = await bcrypt.hash(createAuthDto.password, salt);
      const user = await this.prisma.user.create({
        data: {
          username: createAuthDto.username,
          email: createAuthDto.email,
          locale: createAuthDto.locale,
          credentials: {
            create: {
              password: hashedPassword,
            },
          },
        },
      });
      this.userUtil.sendVerificationEmail(user.id, createAuthDto.locale);
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

  async verify(code: string) {
    const user = await this.prisma.verificationCode.findUnique({
      where: {
        code: code,
      },
    });
    if (!user) {
      throw new HttpException(
        "Verification code doesn't exist",
        HttpStatus.BAD_REQUEST,
      );
    } else {
      await this.prisma.verificationCode.delete({
        where: {
          code: code,
        },
      });

      await this.prisma.user.update({
        where: {
          id: user.userId,
        },
        data: {
          verified: true,
        },
      });
      return {
        message: 'Successfully verified email',
      };
    }
  }

  async login(loginAuthDto: UserAuthDto, res: Response) {
    const user = await this.prisma.user.findUnique({
      where: {
        username: loginAuthDto.username,
      },
      include: {
        credentials: true,
      },
    });
    if (!user) {
      throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
    } else {
      const isPasswordValid = await bcrypt.compare(
        loginAuthDto.password,
        user.credentials.password,
      );
      if (!isPasswordValid) {
        throw new HttpException(
          'Invalid username or password',
          HttpStatus.BAD_REQUEST,
        );
      }
      const token = this.generateJwt(user);
      res
        .cookie('token', token, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          expires: new Date(Date.now() + 1 * 24 * 60 * 1000),
        })
        .send({
          message: 'Successfully logged in',
          user: {
            id: user.id,
            username: user.username,
            picture: user.avatar,
          },
          token: token,
        });
    }
  }

  async oauthLogin(
    provider: TOauthProviders,
    code: string,
    language: TLocale,
    res: Response,
  ) {
    const user = await this.authProvider.login(
      provider,
      code,
      `${process.env.ORIGIN}/${language}/oauth/callback/${provider}`,
    );
    if (!user)
      throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
    const token = this.generateJwt(user);
    res.cookie('token', token, {
      httpOnly: true,
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
    });
    res
      .cookie('token', token, {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        expires: new Date(Date.now() + 1 * 24 * 60 * 1000),
      })
      .send({
        message: 'Successfully logged in',
        user: {
          id: user.id,
          username: user.username,
          picture: user.avatar,
        },
        token: token,
      });
  }
}
