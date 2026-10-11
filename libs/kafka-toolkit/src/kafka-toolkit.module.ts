import { DynamicModule, Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { kafkaEnv } from './kafka.config.js';
import { EventPublisher, KAFKA_CLIENT } from './event-publisher.js';

@Module({})
export class KafkaToolkitModule {
  // Cada servicio lo importa así: KafkaToolkitModule.forService('billing')
  static forService(serviceName: string): DynamicModule {
    const env = kafkaEnv({ clientId: serviceName, groupId: serviceName });
    return {
      module: KafkaToolkitModule,
      imports: [
        ClientsModule.register([
          {
            name: KAFKA_CLIENT,
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: `${env.clientId}-producer`,
                brokers: env.brokers,
              },
              producer: { allowAutoTopicCreation: false },
              producerOnlyMode: true,
            },
          },
        ]),
      ],
      providers: [EventPublisher],
      exports: [EventPublisher],
    };
  }
}