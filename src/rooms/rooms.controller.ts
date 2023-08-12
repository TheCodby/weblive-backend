import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, createRoomSchema } from './dto/create-room.dto';
import { UpdateRoomDto, updateRoomSchema } from './dto/update-room.dto';
import { IUser } from '../interfaces/user';
import { AuthGuard } from '../guards/auth.guard';
import { JoiValidationPipe } from '../validation/JoiValidationPipe';
import { RoomOwnerGuard } from '../guards/room-owner.guard';
import { User } from '../decorators/user.decorator';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}
  @UseGuards(AuthGuard)
  @Post()
  create(
    @Body(new JoiValidationPipe(createRoomSchema)) createRoomDto: CreateRoomDto,
    @User() user: IUser,
  ) {
    return this.roomsService.create(createRoomDto, user.id);
  }

  @UseGuards(AuthGuard)
  @Post('/:id/join')
  join(
    @Param('id') id: string,
    @Body('password') password: string,
    @User() user: IUser,
  ) {
    return this.roomsService.join(+id, password, user.id);
  }

  @Get()
  @UseGuards()
  findAll(@Query('page') page = 1, @Query('search') search = '') {
    return this.roomsService.findAll(page, search);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string, @User() user: IUser) {
    return this.roomsService.findOne(+id, user);
  }

  @UseGuards(AuthGuard, RoomOwnerGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new JoiValidationPipe(updateRoomSchema)) updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomsService.update(+id, updateRoomDto);
  }

  @UseGuards(AuthGuard, RoomOwnerGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomsService.remove(+id);
  }
}
