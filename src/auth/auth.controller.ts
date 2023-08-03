import { Controller, Post, Body, Req, UsePipes } from '@nestjs/common';
import { AuthService } from './auth.service';
import { registerSchema, RegisterDto } from './dto/register.dto';
import { UserAuthDto, authSchema } from './dto/user-auth.dto';
import { JoiValidationPipe } from '../validation/JoiValidationPipe';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @UsePipes(new JoiValidationPipe(registerSchema))
  createAccount(@Body() createAuthDto: RegisterDto) {
    return this.authService.create(createAuthDto);
  }
  @Post('login')
  @UsePipes(new JoiValidationPipe(authSchema))
  login(@Body() loginAuthDto: UserAuthDto) {
    return this.authService.login(loginAuthDto);
  }
  @Post('callback/:provider')
  async callback(@Req() req) {
    return this.authService.callback(req);
  }
}
