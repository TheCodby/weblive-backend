import { Module } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { RoomsController } from './rooms.controller';
import { JwtModule } from '@nestjs/jwt';
import { RoomGateway } from './room.gateway';
import { PrismaService } from '../database/prisma.service';
import { PrismaModule } from '../database/prisma.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1d' },
    }),
    PrismaModule,
  ],
  controllers: [RoomsController],
  providers: [RoomsService, RoomGateway],
})
export class RoomsModule {}
