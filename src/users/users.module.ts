import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { JwtModule } from '@nestjs/jwt';
import { UtilsModule } from '../utils/utils.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    UtilsModule,
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
