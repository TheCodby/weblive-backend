import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
var cors = require('cors');
var corsOptions = {
  origin: '*',
};

async function bootstrap() {
  const appOptions = {
    cors: true,
    httpsOptions: process.env.SSL_KEY_PATH
      ? {
          key: fs.readFileSync(process.env.SSL_KEY_PATH),
          cert: fs.readFileSync(process.env.SSL_CERT_PATH),
        }
      : {},
  };
  const app = await NestFactory.create(AppModule, appOptions);
  app.use(cors(corsOptions));
  await app.listen(process.env.PORT || 443);
}
bootstrap();
