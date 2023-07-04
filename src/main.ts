import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpException } from '@nestjs/common';
const corsOptions = {
  origin: (origin, callback) => {
    if (process.env.ORIGIN === origin) {
      callback(null, true);
    } else {
      callback(new HttpException('Origin not allowed by CORS', 403));
    }
  },
};
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });
  app.enableCors({ ...corsOptions });
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
