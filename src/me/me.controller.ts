import {
  Body,
  Controller,
  Get,
  Patch,
  Req,
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
import { RequestWithUser } from 'src/interfaces/user';
import { UpdateProfileDto, updateProfileSchema } from './dto/UpdateProfile.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { FileSizeValidator } from '../validation/upload/FileSizeValidator';
import {
  CompleteAccountDto,
  completeAccountSchema,
} from './dto/CompleteAccount.dto';

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
  @Post('picture')
  @UseInterceptors(FileInterceptor('file'))
  uploadPicture(
    @UploadedFile(
      new ParseFilePipe({
        validators: [new FileSizeValidator({ maxSize: 50000 })],
      }),
    )
    file: Express.Multer.File,
    @Req() request: RequestWithUser,
  ) {
    return this.meService.updateProfilePicture(file, request);
  }
  @Post('complete')
  @UsePipes(new JoiValidationPipe(completeAccountSchema))
  completeAccount(
    @Req() request: RequestWithUser,
    @Body() completeAccount: CompleteAccountDto,
  ) {
    return this.meService.completeAccount(request, completeAccount);
  }
  @Get('notifications')
  getNotifications(@Req() request: RequestWithUser) {
    return this.meService.getNotifications(+request.user.id);
  }
  @Get('notifications/read')
  readNotifications(@Req() request: RequestWithUser) {
    return this.meService.readNotifications(+request.user.id);
  }
  @Post('resend-verification')
  resendVerification(@Req() req: RequestWithUser) {
    return this.meService.resendVerificationEmail(req.user.id);
  }
}
