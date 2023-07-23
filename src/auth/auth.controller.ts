import { Controller, Post, Body, Get, Req, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { createAuthSchema } from './dto/user-auth.dto';
import { UserAuthDto } from './dto/user-auth.dto';
import { JoiValidationPipe } from '../validation/JoiValidationPipe';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @UsePipes(new JoiValidationPipe(createAuthSchema))
  createAccount(@Body() createAuthDto: UserAuthDto) {
    return this.authService.create(createAuthDto);
  }
  @Post('login')
  login(@Body() loginAuthDto: UserAuthDto) {
    return this.authService.login(loginAuthDto);
  }
  @Post('callback/:provider')
  async callback(@Req() req) {
    return this.authService.callback(req);
  }
}
