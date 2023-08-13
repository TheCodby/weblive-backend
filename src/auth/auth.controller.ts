import {
  Controller,
  Post,
  Body,
  Param,
  UsePipes,
  Query,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { registerSchema, RegisterDto } from './dto/register.dto';
import { UserAuthDto, authSchema } from './dto/user-auth.dto';
import { JoiValidationPipe } from '../validation/JoiValidationPipe';
import { TOauthProviders } from './oauth/oauth.service';
import { TLocale } from '../types/main';
import { Response } from 'express';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @UsePipes(new JoiValidationPipe(registerSchema))
  createAccount(@Body() createAuthDto: RegisterDto) {
    return this.authService.create(createAuthDto);
  }
  @Post('login')
  login(
    @Body(new JoiValidationPipe(authSchema)) loginAuthDto: UserAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.login(loginAuthDto, res);
  }
  @Post('callback/:provider')
  async callback(
    @Param('provider') provider: TOauthProviders,
    @Body('code') code: string,
    @Query('locale') language: TLocale,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.oauthLogin(provider, code, language, res);
  }
  @Post('verify')
  verify(@Query('code') code: string) {
    return this.authService.verify(code);
  }
}
