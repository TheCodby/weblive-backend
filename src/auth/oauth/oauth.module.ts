import { Module } from '@nestjs/common';
import DiscordService from './discord.service';
import { PrismaModule } from '@/src/database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [DiscordService],
  exports: [DiscordService],
})
export class OauthModule {}
