import { Controller, UseGuards, Get, Delete, Param } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminGuard } from '../guards/admin.guard';

@Controller('admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  async getUsers(@Param('page') page: number) {
    return await this.adminService.getUsers(page);
  }
  @Delete('users/:id')
  async deleteUser(id: number) {
    return await this.adminService.deleteUser(+id);
  }
}
