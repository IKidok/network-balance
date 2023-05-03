import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  BigInt.prototype['toJSON'] = function () {
    return this.toString();
  };
  await app.listen(3000);
}

bootstrap();
