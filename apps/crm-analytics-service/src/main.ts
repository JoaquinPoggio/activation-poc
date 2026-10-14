import { NestFactory } from '@nestjs/core';
import { kafkaConsumerOptions } from '@app/kafka-toolkit';
import { CrmAnalyticsServiceModule } from './crm-analytics-service.module.js';

async function bootstrap() {
  // fromBeginning: un grupo NUEVO arranca desde el primer mensaje que Kafka conserva (replay)
  const app = await NestFactory.createMicroservice(
    CrmAnalyticsServiceModule,
    kafkaConsumerOptions('crm-analytics-service', {
      groupId: 'crm-analytics',
      fromBeginning: true,
    }),
  );
  await app.listen();
}
bootstrap();
