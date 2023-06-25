import { Controller, Post, Body, Get, Req, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { createAuthSchema } from './dto/user-auth.dto';
import { UserAuthDto } from './dto/user-auth.dto';
import { Request } from 'express';
import { JoiValidationPipe } from 'src/validation/JoiValidationPipe';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @UsePipes(new JoiValidationPipe(createAuthSchema))
  createAccount(@Body() createAuthDto: UserAuthDto, @Req() request: Request) {
    return this.authService.create(createAuthDto);
  }
  @Post('login')
  login(@Body() loginAuthDto: UserAuthDto) {
    return this.authService.login(loginAuthDto);
  }
}
