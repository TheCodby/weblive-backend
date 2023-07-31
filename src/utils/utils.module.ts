import { Module, Global } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { UserUtil } from './user.util';
import { S3Util } from './s3.util';

@Global()
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    PrismaModule,
  ],
  providers: [UserUtil, S3Util],
  exports: [UserUtil, S3Util],
})
export class UtilsModule {}
