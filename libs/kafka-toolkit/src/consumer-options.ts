import { KafkaOptions, Transport } from '@nestjs/microservices';
import { kafkaEnv } from './kafka.config.js';

// Opciones del transporte Kafka para que un servicio CONSUMA eventos con @EventPattern
export function kafkaConsumerOptions(
  serviceName: string,
  opts: { groupId?: string; fromBeginning?: boolean } = {},
): KafkaOptions {
  const env = kafkaEnv({
    clientId: serviceName,
    groupId: opts.groupId ?? serviceName,
  });
  return {
    transport: Transport.KAFKA,
    options: {
      postfixId: '',
      client: { clientId: env.clientId, brokers: env.brokers },
      consumer: { groupId: env.groupId },
      // true: un grupo nuevo lee el topic desde el principio (replay, RF-10)
      subscribe: { fromBeginning: opts.fromBeginning ?? false },
    },
  };
}