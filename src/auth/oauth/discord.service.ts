import { PrismaService } from '@/src/database/prisma.service';
import { IOauthProvider } from '@/src/interfaces/oauth';
import { UserUtil } from '@/src/utils/user.util';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export default class DiscordService implements IOauthProvider {
  constructor(
    private readonly prisma: PrismaService,
    private readonly users: UserUtil,
  ) {}
  async getAccessToken(code: string, redirectUri: string) {
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
        redirect_uri: redirectUri,
        scope: 'identify',
      }),
    });
    if (!response.ok) throw new Error('Failed to fetch access token');
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
    if (!response.ok) throw new Error('Failed to fetch user profile');
    return response.json();
  }

  async getUser(code: string, redirectUri: string, userId?: number) {
    try {
      const accessToken = await this.getAccessToken(code, redirectUri);
      const profile = await this.profile(accessToken);
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
    } catch (e) {
      console.log(e);
      throw new HttpException('Failed to connect', HttpStatus.BAD_REQUEST);
    }
  }
}
