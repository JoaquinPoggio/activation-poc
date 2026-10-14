import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import type { ClientSession } from 'mongoose';
import { createEvent, type DomainEvent } from '@app/contracts';
import { EventPublisher, IdempotencyService } from '@app/kafka-toolkit';
import { ProvisioningOrder } from './provisioning.schema.js';

@Injectable()
export class ProvisioningService {
  private readonly logger = new Logger(ProvisioningService.name);

  constructor(
    @InjectModel(ProvisioningOrder.name) private readonly model: Model<ProvisioningOrder>,
    private readonly publisher: EventPublisher,
    private readonly idempotency: IdempotencyService,
  ) {}

  async onActivationRequested(event: DomainEvent<'ActivationRequested'>) {
    const first = await this.idempotency.runOnce(event.eventId, (session) =>
      this.provision(event, session),
    );
    if (!first) {
      this.logger.warn(`Evento repetido ${event.eventType} [${event.correlationId}]: descartado`);
    }
  }

  private async provision(event: DomainEvent<'ActivationRequested'>, session: ClientSession) {
    const { correlationId, customerId, payload } = event;

    // Simula el trabajo de aprovisionar la línea: entre 1 y 3 segundos
    await new Promise((resolve) => setTimeout(resolve, 1000 + Math.random() * 2000));

    // Fallo de negocio simulado: se publica como evento, no es un error técnico
    if (payload.simulateFailure === 'provisioning') {
      this.logger.warn(`Fallo simulado de provisioning [${correlationId}]`);
      await this.publisher.publish(
        createEvent('ProvisioningFailed', {
          correlationId,
          customerId,
          source: 'provisioning-service',
          payload: { reason: 'Fallo simulado en provisioning' },
        }),
      );
      return;
    }

    const orderId = `ord-${correlationId}`;
    await this.model.updateOne(
      { activationId: correlationId },
      { $setOnInsert: { activationId: correlationId, customerId, orderId, status: 'COMPLETED' } },
      { upsert: true, session },
    );
    this.logger.log(`Orden ${orderId} completada [${correlationId}]`);

    await this.publisher.publish(
      createEvent('ProvisioningCompleted', {
        correlationId,
        customerId,
        source: 'provisioning-service',
        payload: { orderId },
      }),
    );
  }
}