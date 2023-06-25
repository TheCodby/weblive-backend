import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
var cors = require('cors');
var corsOptions = {
  // change it to website you wish to allow
  origin: '*',
};
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.use(cors(corsOptions));
  await app.listen(3001);
}
bootstrap();
