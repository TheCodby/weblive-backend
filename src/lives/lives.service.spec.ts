import { Test, TestingModule } from '@nestjs/testing';
import { LivesService } from './lives.service';

describe('LivesService', () => {
  let service: LivesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LivesService],
    }).compile();

    service = module.get<LivesService>(LivesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
