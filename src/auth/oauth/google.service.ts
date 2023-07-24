import { PrismaService } from '@/src/database/prisma.service';
import { IOauthProvider } from '@/src/interfaces/oauth';
import { generateRandomUsername } from '@/src/utils/user';
import { randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export default class GoogleService implements IOauthProvider {
  constructor(private readonly prisma: PrismaService) {}
  async getAccessToken(code: string) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.ORIGIN}/oauth/callback/google`,
      }),
    });
    const data = await response.json();
    return data.access_token;
  }
  async profile(accessToken: string) {
    const response = await fetch(
      `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`,
    );
    return response.json();
  }
  async createAccount(profile: any) {
    return await this.prisma.user.upsert({
      where: {
        googleId: profile.sub,
      },
      update: {},
      create: {
        username: generateRandomUsername(),
        googleId: profile.sub,
      },
    });
  }
  async login(code: string) {
    const accessToken = await this.getAccessToken(code);
    const profile = await this.profile(accessToken);
    console.log(profile);
    const user = await this.prisma.user.findUnique({
      where: {
        googleId: profile.sub,
      },
    });
    if (!user) {
      return await this.createAccount(profile);
    }
    return user;
  }
}
