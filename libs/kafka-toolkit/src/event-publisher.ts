import {
  Inject,
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';
import { DomainEvent, EventTopic } from '@app/contracts';

export const KAFKA_CLIENT = 'KAFKA_CLIENT';

@Injectable()
export class EventPublisher implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EventPublisher.name);

  constructor(@Inject(KAFKA_CLIENT) private readonly client: ClientKafka) {}

  async onModuleInit(): Promise<void> {
    await this.client.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
  }

  // El topic sale del contrato y la clave del mensaje es el customerId (RNF-02)
  async publish(event: DomainEvent): Promise<void> {
    const topic = EventTopic[event.eventType];
    await lastValueFrom(
      this.client.emit(topic, {
        key: event.customerId,
        value: event,
        headers: {
          correlationId: event.correlationId,
          eventType: event.eventType,
        },
      }),
    );
    this.logger.log(`Publicado ${event.eventType} [${event.correlationId}] en ${topic}`);
  }
}