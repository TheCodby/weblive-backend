import { PrismaService } from '@/src/database/prisma.service';
import { IOauthProvider } from '@/src/interfaces/oauth';
import { Injectable } from '@nestjs/common';
import { UserUtil } from '@/src/utils/user.util';

@Injectable()
export default class GoogleService implements IOauthProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UserUtil,
  ) {}
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
        username: this.users.generateRandomUsername(),
        googleId: profile.sub,
        verified: true,
      },
    });
  }
  async login(code: string) {
    const accessToken = await this.getAccessToken(code);
    const profile = await this.profile(accessToken);
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
