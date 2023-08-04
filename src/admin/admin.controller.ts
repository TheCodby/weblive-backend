import {
  Controller,
  UseGuards,
  Get,
  Delete,
  Param,
  Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '../guards/admin.guard';
import { AuthGuard } from '../guards/auth.guard';

@Controller('admin')
@UseGuards(AuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers(@Query('page') page = 1) {
    return await this.adminService.getUsers(page);
  }
  @Get('users/:id')
  async getUser(@Param('id') id: number) {
    return await this.adminService.getUser(+id);
  }
  @Delete('users/:id')
  async deleteUser(id: number) {
    return await this.adminService.deleteUser(+id);
  }
}
