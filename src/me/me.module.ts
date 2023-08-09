import { Module } from '@nestjs/common';
import { MeService } from './me.service';
import { MeController } from './me.controller';
import { JwtModule } from '@nestjs/jwt';
import { OauthModule } from '../auth/oauth/oauth.module';
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    OauthModule,
  ],
  controllers: [MeController],
  providers: [MeService],
})
export class MeModule {}
