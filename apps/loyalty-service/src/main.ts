import { NestFactory } from '@nestjs/core';
import { kafkaConsumerOptions } from '@app/kafka-toolkit';
import { LoyaltyServiceModule } from './loyalty-service.module.js';

async function bootstrap() {
  // Grupo nuevo + fromBeginning: lee TODO el historial de activation.events (replay)
  const app = await NestFactory.createMicroservice(
    LoyaltyServiceModule,
    kafkaConsumerOptions('loyalty-service', { groupId: 'loyalty', fromBeginning: true }),
  );
  await app.listen();
}
bootstrap();