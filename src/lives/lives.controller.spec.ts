import { Test, TestingModule } from '@nestjs/testing';
import { LivesController } from './lives.controller';
import { LivesService } from './lives.service';

describe('LivesController', () => {
  let controller: LivesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LivesController],
      providers: [LivesService],
    }).compile();

    controller = module.get<LivesController>(LivesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
