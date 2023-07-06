import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  UsePipes,
  Query,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto, createRoomSchema } from './dto/create-room.dto';
import { UpdateRoomDto } from './dto/update-room.dto';
import { RequestWithUser } from '../interfaces/user';
import { AuthGuard } from '../utils/guards/auth.guard';
import { JoiValidationPipe } from '../validation/JoiValidationPipe';
import { RoomOwnerGuard } from '../utils/guards/room-owner.guard';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}
  @UseGuards(AuthGuard)
  @Post()
  @UsePipes(new JoiValidationPipe(createRoomSchema))
  create(
    @Body() createRoomDto: CreateRoomDto,
    @Req() request: RequestWithUser,
  ) {
    return this.roomsService.create(createRoomDto, request);
  }

  @UseGuards(AuthGuard)
  @Post('/:id/join')
  join(
    @Param('id') id: string,
    @Body('password') password: string,
    @Req() request: RequestWithUser,
  ) {
    return this.roomsService.join(id, password, request);
  }

  @Get()
  @UseGuards()
  findAll(@Query('page') page: number = 1) {
    return this.roomsService.findAll(page);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(+id);
  }

  @UseGuards(AuthGuard, RoomOwnerGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomsService.update(+id, updateRoomDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomsService.remove(+id);
  }
}
