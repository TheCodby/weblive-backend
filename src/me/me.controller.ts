import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import { MeService } from './me.service';
import { Request } from 'express';
import { AuthGuard } from 'src/auth/auth.guard';
import { JoiValidationPipe } from 'src/validation/JoiValidationPipe';
import {
  ChangePasswordDto,
  changePasswordSchema,
} from './dto/ChangePassword.dto';
import { RequestWithUser } from 'src/interfaces/user';
import { UpdateProfileDto, updateProfileSchema } from './dto/UpdateProfile.dto';

@Controller('me')
@UseGuards(AuthGuard)
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get('profile')
  getProfile(@Req() request: RequestWithUser) {
    return this.meService.getProfile(request);
  }
  @Patch('change-password')
  @UsePipes(new JoiValidationPipe(changePasswordSchema))
  changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() request: RequestWithUser,
  ) {
    return this.meService.changePassword(changePasswordDto, request);
  }
  @Patch('profile')
  @UsePipes(new JoiValidationPipe(updateProfileSchema))
  updateProfile(
    @Body() updateProfileDto: UpdateProfileDto,
    @Req() request: RequestWithUser,
  ) {
    return this.meService.updateProfile(updateProfileDto, request);
  }
}
