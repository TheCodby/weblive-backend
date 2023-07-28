import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { MeModule } from './me/me.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { RoomsModule } from './rooms/rooms.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule,
    MeModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '../..', 'public'),
      serveRoot: '/public/',
      serveStaticOptions: {
        index: false,
      },
    }),
    RoomsModule,
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
    AdminModule,
    UsersModule,
  ],
})
export class AppModule {}
