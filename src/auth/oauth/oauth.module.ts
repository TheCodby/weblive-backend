import { Module } from '@nestjs/common';
import DiscordService from './discord.service';
import GoogleService from './google.service';
import { PrismaModule } from '@/src/database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DiscordService, GoogleService],
  exports: [DiscordService, GoogleService],
})
export class OauthModule {}
