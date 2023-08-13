import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaExceptionFilter } from './exceptions/prisma.filter';
import * as cookieParser from 'cookie-parser';
// const corsOptions = {
//   origin: (origin, callback) => {
//     if (process.env.ORIGIN === origin || !origin) {
//       callback(null, true);
//     } else {
//       callback(new HttpException('Origin not allowed by CORS', 403));
//     }
//   },
// };
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: true,
  });
  app.enableCors({
    origin: process.env.ORIGIN,
    credentials: true,
  });
  app.use(cookieParser());
  app.useGlobalFilters(new PrismaExceptionFilter());
  await app.listen(parseInt(process.env.PORT) || 3000);
}
bootstrap();
