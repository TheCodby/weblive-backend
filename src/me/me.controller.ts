import {
  Body,
  Controller,
  Get,
  Patch,
  UseGuards,
  UsePipes,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
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
import {
  CompleteAccountDto,
  completeAccountSchema,
} from './dto/CompleteAccount.dto';
import { User } from '../decorators/user.decorator';

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
    changePasswordDto: ChangePasswordDto,
    @User() user: IUser,
  ) {
    return this.meService.changePassword(changePasswordDto, user.id);
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
  @Post('complete')
  completeAccount(
    @User() user: IUser,
    @Body(new JoiValidationPipe(completeAccountSchema))
    completeAccount: CompleteAccountDto,
  ) {
    return this.meService.completeAccount(user.id, completeAccount);
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
  resendVerification(@User() user: IUser) {
    return this.meService.resendVerificationEmail(user.id);
  }
}
