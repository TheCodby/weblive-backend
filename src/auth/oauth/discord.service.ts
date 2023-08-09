import { PrismaService } from '@/src/database/prisma.service';
import { IOauthProvider } from '@/src/interfaces/oauth';
import { UserUtil } from '@/src/utils/user.util';
import { Injectable } from '@nestjs/common';

@Injectable()
export default class DiscordService implements IOauthProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UserUtil,
  ) {}
  async getAccessToken(code: string) {
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
  async profile(accessToken: string) {
    const response = await fetch('https://discord.com/api/users/@me', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.json();
  }

  async getUser(code: string, userId?: number) {
    const accessToken = await this.getAccessToken(code);
    const profile = await this.profile(accessToken);
    console.log(userId);
    if (!userId) {
      return await this.prisma.user.upsert({
        where: {
          discordId: profile.id,
        },
        update: {
          avatar: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
        },
        create: {
          username: this.users.generateRandomUsername(),
          discordId: profile.id,
          verified: true,
          avatar: `https://cdn.discordapp.com/avatars/${profile.id}/${profile.avatar}.png`,
          email: profile.email,
          loginMethod: 'Social',
        },
      });
    } else {
      return await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          discordId: profile.id,
        },
      });
    }
  }
}
