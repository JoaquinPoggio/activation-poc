import { NestFactory } from '@nestjs/core';
import { kafkaConsumerOptions } from '@app/kafka-toolkit';
import { ProvisioningServiceModule } from './provisioning-service.module.js';

async function bootstrap() {
  // Sin HTTP: solo consume de Kafka. Consumer group distinto al de billing,
  // por eso ambos reciben el mismo ActivationRequested.
  const app = await NestFactory.createMicroservice(
    ProvisioningServiceModule,
    kafkaConsumerOptions('provisioning-service', { groupId: 'provisioning-svc' }),
  );
  await app.listen();
}
bootstrap();
