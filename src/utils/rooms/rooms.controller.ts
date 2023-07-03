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

@Controller('rooms')
@UseGuards(AuthGuard)
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @UsePipes(new JoiValidationPipe(createRoomSchema))
  create(
    @Body() createRoomDto: CreateRoomDto,
    @Req() request: RequestWithUser,
  ) {
    return this.roomsService.create(createRoomDto, request);
  }
  @Post('/:id/join')
  join(
    @Param('id') id: string,
    @Body('password') password: string,
    @Req() request: RequestWithUser,
  ) {
    return this.roomsService.join(id, password, request);
  }

  @Get()
  findAll(@Query('page') page: number = 1) {
    return this.roomsService.findAll(page);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRoomDto: UpdateRoomDto) {
    return this.roomsService.update(+id, updateRoomDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomsService.remove(+id);
  }
}
