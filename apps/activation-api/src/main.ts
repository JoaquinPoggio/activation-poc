import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import type { MicroserviceOptions } from '@nestjs/microservices';
import { kafkaConsumerOptions } from '@app/kafka-toolkit';
import { ActivationApiModule } from './activation-api.module.js';

async function bootstrap() {
  const app = await NestFactory.create(ActivationApiModule);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.enableCors();

  // Además de HTTP, la API consume los resultados de billing y provisioning.
  // Consumer group "activation-api" (el del documento).
  app.connectMicroservice<MicroserviceOptions>(
    kafkaConsumerOptions('activation-api', { groupId: 'activation-api' }),
  );
  await app.startAllMicroservices();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
