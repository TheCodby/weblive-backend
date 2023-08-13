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
  Res,
  Query,
  Sse,
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
import { Response } from 'express';
import { AuthGuardCookie } from '../guards/auth-cookie.guard';
import { Observable, Observer } from 'rxjs';
import { NotificationsUtil } from '../utils/notifications.util';

@Controller('me')
export class MeController {
  constructor(
    private readonly meService: MeService,
    private readonly notifications: NotificationsUtil,
  ) {}

  @Get('profile')
  @UseGuards(AuthGuard)
  getProfile(@User() user: IUser) {
    return this.meService.getProfile(user.id);
  }
  @Patch('change-password')
  @UseGuards(AuthGuard)
  changePassword(
    @Body(new JoiValidationPipe(changePasswordSchema))
    inputs: ChangePasswordDto,
    @User() user: IUser,
  ) {
    return this.meService.changePassword(inputs, user.id);
  }
  @Post('profile-visibility')
  @UseGuards(AuthGuard)
  toggleVisibility(@User() user: IUser) {
    return this.meService.toggleVisibility(user.id);
  }
  @Put('change-email')
  @UseGuards(AuthGuard)
  changeEmail(
    @Body(new JoiValidationPipe(changeEmailSchema))
    inputs: ChangeEmailDto,
    @User() user: IUser,
  ) {
    return this.meService.changeEmail(inputs, user.id);
  }
  @Patch('profile')
  @UseGuards(AuthGuard)
  updateProfile(
    @Body(new JoiValidationPipe(updateProfileSchema))
    updateProfileDto: UpdateProfileDto,
    @User() user: IUser,
  ) {
    return this.meService.updateProfile(updateProfileDto, user.id);
  }
  @Post('picture')
  @UseGuards(AuthGuard)
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
  @Sse('notifications')
  @UseGuards(AuthGuardCookie)
  async getNotifications(
    @User() user: IUser,
    @Res({ passthrough: true }) res: Response,
  ): Promise<Observable<object>> {
    res
      .setHeader('Access-Control-Allow-Origin', process.env.ORIGIN)
      .setHeader('Content-Type', 'text/event-stream');
    const userId = +user.id;
    const initialNotifications = await this.meService.getNotifications(
      +user.id,
    );
    const observer: Observer<object> = {
      next: (data: any) => {
        res.write(`data: ${JSON.stringify(data)}\n\n`);
      },
      error: (error: any) => {
        res.status(500).end();
      },
      complete: () => {
        console.log('done');
        res.end();
        this.notifications.removeNotificationClient(userId);
      },
    };
    this.notifications.addNotificationClient(userId, observer);

    return new Observable((subscriber) => {
      this.notifications.getNotificationClient(userId).then((client) => {
        client.next({
          notifications: initialNotifications,
        });
        subscriber.add(() => {
          this.notifications.removeNotificationClient(userId);
        });
      });
    });
  }
  @Post('resend-verification')
  @UseGuards(AuthGuard)
  resendVerification(@User() user: IUser, @Query('locale') language: TLocale) {
    return this.meService.resendVerificationEmail(user.id, language);
  }
  @Post('connect/:provider')
  @UseGuards(AuthGuard)
  async callback(
    @Param('provider') provider: TOauthProviders,
    @Body('code') code: string,
    @User() user: IUser,
    @Query('locale') language: string,
  ) {
    return this.meService.oauthConnect(provider, code, language, +user.id);
  }
}
