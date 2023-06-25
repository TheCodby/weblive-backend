import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { LivesModule } from './lives/lives.module';
import { MeModule } from './me/me.module';

@Module({
  imports: [AuthModule, LivesModule, MeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
