import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { UserUtil } from './user.util';
import { S3Util } from './s3.util';
import { RedisCache } from './cache.util';
import { NotificationsUtil } from './notifications.util';
import { MailerUtil } from './mailer.util';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  providers: [UserUtil, S3Util, NotificationsUtil, RedisCache, MailerUtil],
  exports: [UserUtil, S3Util, NotificationsUtil, MailerUtil],
})
export class UtilsModule {}
