import { Module } from '@nestjs/common';
import { PrismaModule } from '@/src/database/prisma.module';
import { OauthService } from './oauth.service';
import DiscordService from './discord.service';
import GoogleService from './google.service';

@Module({
  imports: [PrismaModule],
  providers: [OauthService, DiscordService, GoogleService],
  exports: [OauthService],
})
export class OauthModule {}
