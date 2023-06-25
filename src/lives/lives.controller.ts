import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { LivesService } from './lives.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Controller('lives')
@UseGuards(AuthGuard)
export class LivesController {
  constructor(private readonly livesService: LivesService) {}

  @Get()
  getLives(@Req() request: Request) {
    return 'Hello World';
  }
}
