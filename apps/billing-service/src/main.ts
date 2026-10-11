import { NestFactory } from '@nestjs/core';
import { kafkaConsumerOptions } from '@app/kafka-toolkit';
import { BillingServiceModule } from './billing-service.module.js';

async function bootstrap() {
  // Billing no expone HTTP: es un microservicio que solo consume de Kafka.
  // groupId "billing-svc": el consumer group del documento.
  const app = await NestFactory.createMicroservice(
    BillingServiceModule,
    kafkaConsumerOptions('billing-service', { groupId: 'billing-svc' }),
  );
  await app.listen();
}
bootstrap();