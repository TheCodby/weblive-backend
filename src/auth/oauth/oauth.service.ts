import DiscordService from './discord.service';
import GoogleService from './google.service';
import Prisma from '@prisma/client';
import { Injectable } from '@nestjs/common';
export type TOauthProviders = 'google' | 'discord';
@Injectable()
export class OauthService {
  constructor(
    private readonly discordService: DiscordService,
    private readonly googleService: GoogleService,
  ) {}

  async login(provider: TOauthProviders, code: string) {
    let user: Prisma.User;
    switch (provider) {
      case 'discord':
        user = await this.discordService.getUser(code);
        break;
      case 'google':
        user = await this.googleService.getUser(code);
        break;
      default:
        return false;
    }
    return user;
  }
}
