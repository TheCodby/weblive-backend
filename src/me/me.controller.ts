import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
  Param,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  Put,
  Query,
} from '@nestjs/common';
import { MeService } from './me.service';
import { AuthGuard } from '@/src/guards/auth.guard';
import { JoiValidationPipe } from 'src/validation/JoiValidationPipe';
import {
  ChangePasswordDto,
  changePasswordSchema,
} from './dto/ChangePassword.dto';
import { IUser } from 'src/interfaces/user';
import { UpdateProfileDto, updateProfileSchema } from './dto/UpdateProfile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileSizeValidator } from '../validation/upload/FileSizeValidator';

import { User } from '../decorators/user.decorator';
import { ChangeEmailDto, changeEmailSchema } from './dto/ChangeEmail.dto';
import { TOauthProviders } from '../auth/oauth/oauth.service';
import { TLocale } from '../types/main';

@Controller('me')
@UseGuards(AuthGuard)
export class MeController {
  constructor(private readonly meService: MeService) {}

  @Get('profile')
  getProfile(@User() user: IUser) {
    return this.meService.getProfile(user.id);
  }
  @Patch('change-password')
  changePassword(
    @Body(new JoiValidationPipe(changePasswordSchema))
    inputs: ChangePasswordDto,
    @User() user: IUser,
  ) {
    return this.meService.changePassword(inputs, user.id);
  }
  @Put('change-email')
  changeEmail(
    @Body(new JoiValidationPipe(changeEmailSchema))
    inputs: ChangeEmailDto,
    @User() user: IUser,
  ) {
    return this.meService.changeEmail(inputs, user.id);
  }
  @Patch('profile')
  updateProfile(
    @Body(new JoiValidationPipe(updateProfileSchema))
    updateProfileDto: UpdateProfileDto,
    @User() user: IUser,
  ) {
    return this.meService.updateProfile(updateProfileDto, user.id);
  }
  @Post('picture')
  @UseInterceptors(FileInterceptor('file'))
  uploadPicture(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileSizeValidator({ maxSize: 50000 })],
      }),
    )
    file: Express.Multer.File,
    @User() user: IUser,
  ) {
    return this.meService.updateProfilePicture(file, user.id);
  }
  @Get('notifications')
  getNotifications(@User() user: IUser) {
    return this.meService.getNotifications(+user.id);
  }
  @Get('notifications/read')
  readNotifications(@User() user: IUser) {
    return this.meService.readNotifications(+user.id);
  }
  @Post('resend-verification')
  resendVerification(@User() user: IUser, @Query('locale') language: TLocale) {
    return this.meService.resendVerificationEmail(user.id, language);
  }
  @Post('connect/:provider')
  async callback(
    @Param('provider') provider: TOauthProviders,
    @Body('code') code: string,
    @User() user: IUser,
    @Query('locale') language: string,
  ) {
    return this.meService.oauthConnect(provider, code, language, +user.id);
  }
}
