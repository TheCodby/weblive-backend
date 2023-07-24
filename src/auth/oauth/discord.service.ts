import { PrismaService } from '@/src/database/prisma.service';
import { OauthProvider } from '@/src/interfaces/oauth';
import { generateRandomUsername } from '@/src/utils/user';
import { randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export default class DiscordService implements OauthProvider {
  constructor(private readonly prisma: PrismaService) {}
  private async getAccessToken(code: string) {
    const response = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.DISCORD_CLIENT_ID,
        client_secret: process.env.DISCORD_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.ORIGIN}/oauth/callback/discord`,
        scope: 'identify',
      }),
    });
    const data = await response.json();
    return data.access_token;
  }
  private async profile(accessToken: string) {
    const response = await fetch('https://discord.com/api/users/@me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.json();
  }
  private async createAccount(profile: any) {
    return await this.prisma.user.upsert({
      where: {
        discordId: profile.id,
      },
      update: {},
      create: {
        username: generateRandomUsername(),
        discordId: profile.id,
        password: randomBytes(16).toString('hex'),
      },
    });
  }
  async login(code: string) {
    const accessToken = await this.getAccessToken(code);
    const profile = await this.profile(accessToken);
    console.log(profile);
    const user = await this.prisma.user.findUnique({
      where: {
        discordId: profile.id,
      },
    });
    if (!user) {
      return await this.createAccount(profile);
    }
    return user;
  }
}
