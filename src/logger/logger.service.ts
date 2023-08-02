import { ConsoleLogger } from '@nestjs/common';

export default class CustomLoggerService extends ConsoleLogger {
  constructor(context: string) {
    super(context, {
      timestamp: true,
    });
  }
}
