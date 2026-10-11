import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createEvent, type DomainEvent } from '@app/contracts';
import { EventPublisher } from '@app/kafka-toolkit';
import { BillingAccount } from './billing.schema.js';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectModel(BillingAccount.name) private readonly model: Model<BillingAccount>,
    private readonly publisher: EventPublisher,
  ) {}

  async onActivationRequested(event: DomainEvent<'ActivationRequested'>) {
    const { correlationId, customerId, payload } = event;

    // Fallo de negocio simulado: se publica como evento, no es un error técnico
    if (payload.simulateFailure === 'billing') {
      this.logger.warn(`Fallo simulado de billing [${correlationId}]`);
      await this.publisher.publish(
        createEvent('BillingFailed', {
          correlationId,
          customerId,
          source: 'billing-service',
          payload: { reason: 'Fallo simulado en billing' },
        }),
      );
      return;
    }

    // Crea la cuenta. Si ya existe un registro (p. ej. porque ActivationFailed llegó
    // antes), se conserva su estado y solo se completa el accountId.
    const accountId = `acc-${correlationId}`;
    const account = await this.model.findOneAndUpdate(
      { activationId: correlationId },
      { $set: { accountId }, $setOnInsert: { customerId, status: 'CREATED' } },
      { upsert: true, new: true },
    );

    // Caso borde: el fallo ya había llegado. La cuenta se creó, pero se anula igual.
    if (account?.status === 'CANCELLED') {
      this.logger.warn(`Cuenta ${accountId} creada tras ver el fallo: queda ANULADA [${correlationId}]`);
      await this.publishCancelled(correlationId, customerId, accountId, 'Activación fallida antes de crear la cuenta');
      return;
    }

    this.logger.log(`Cuenta ${accountId} creada [${correlationId}]`);
    await this.publisher.publish(
      createEvent('BillingAccountCreated', {
        correlationId,
        customerId,
        source: 'billing-service',
        payload: { accountId },
      }),
    );
  }

  // Compensación: la activación falló, se anula la cuenta si existía
  async onActivationFailed(event: DomainEvent<'ActivationFailed'>) {
    const { correlationId, customerId, payload } = event;

    // new: false devuelve el documento ANTES del cambio (o null si no existía)
    const before = await this.model.findOneAndUpdate(
      { activationId: correlationId },
      { $set: { status: 'CANCELLED' }, $setOnInsert: { customerId } },
      { upsert: true, new: false },
    );

    if (!before) {
      // Todavía no había cuenta: queda registrado el fallo para anularla si se crea después
      this.logger.log(`Sin cuenta para anular [${correlationId}]; queda registrado el fallo`);
      return;
    }
    if (before.status === 'CANCELLED') return; // ya estaba anulada

    this.logger.warn(`Cuenta ${before.accountId} ANULADA [${correlationId}]`);
    await this.publishCancelled(correlationId, customerId, before.accountId, payload.reason);
  }

  private publishCancelled(
    correlationId: string,
    customerId: string,
    accountId: string | undefined,
    reason: string,
  ) {
    return this.publisher.publish(
      createEvent('BillingAccountCancelled', {
        correlationId,
        customerId,
        source: 'billing-service',
        payload: { accountId, reason },
      }),
    );
  }
}