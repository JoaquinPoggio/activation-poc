import { NestFactory } from '@nestjs/core';
import { kafkaConsumerOptions } from '@app/kafka-toolkit';
import { NotificationServiceModule } from './notification-service.module.js';

async function bootstrap() {
  const app = await NestFactory.createMicroservice(
    NotificationServiceModule,
    kafkaConsumerOptions('notification-service', { groupId: 'notification-svc' }),
  );
  await app.listen();
}
bootstrap();