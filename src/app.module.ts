import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { MeModule } from './me/me.module';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
