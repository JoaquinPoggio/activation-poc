import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createEvent, type DomainEvent, type EventType } from '@app/contracts';
import { EventPublisher } from '@app/kafka-toolkit';
import { Activation } from './activation.schema.js';
import { ActivationGateway } from './activation.gateway.js';

type Step = 'billing' | 'provisioning';

// Qué eventos son "resultados" de un paso de la saga
const RESULTS: Partial<Record<EventType, { step: Step; ok: boolean }>> = {
  BillingAccountCreated: { step: 'billing', ok: true },
  BillingFailed: { step: 'billing', ok: false },
  ProvisioningCompleted: { step: 'provisioning', ok: true },
  ProvisioningFailed: { step: 'provisioning', ok: false },
};

@Injectable()
export class ActivationSagaService {
  private readonly logger = new Logger(ActivationSagaService.name);

  constructor(
    @InjectModel(Activation.name) private readonly model: Model<Activation>,
    private readonly publisher: EventPublisher,
    private readonly gateway: ActivationGateway,
  ) {}

  async onServiceEvent(event: DomainEvent) {
    const id = event.correlationId;
    const entry = { eventType: event.eventType, at: event.occurredAt };
    const result = RESULTS[event.eventType];

    // Eventos que no son un resultado (p. ej. BillingAccountCancelled): solo historial
    if (!result) {
      const d = await this.model.findOneAndUpdate(
        { _id: id },
        { $push: { history: entry } },
        { new: true },
      );
      if (d) {
        this.gateway.notify({
          activationId: id,
          customerId: event.customerId,
          eventType: event.eventType,
          at: event.occurredAt,
          status: d.status,
        });
      }
      return;
    }

    // 1) Guardar el resultado del paso y registrarlo en el historial
    const doc = await this.model.findOneAndUpdate(
      { _id: id },
      {
        $set: { [`steps.${result.step}`]: { status: result.ok ? 'OK' : 'FAILED', at: event.occurredAt } },
        $push: { history: entry },
      },
      { new: true },
    );
    if (!doc) {
      this.logger.warn(`Evento ${event.eventType} para una activación desconocida [${id}]`);
      return;
    }

    // 2) Con el primer resultado: PENDING -> IN_PROGRESS
    await this.model.updateOne({ _id: id, status: 'PENDING' }, { $set: { status: 'IN_PROGRESS' } });

    // Avisar a la UI del evento recién recibido
    this.gateway.notify({
      activationId: id,
      customerId: event.customerId,
      eventType: event.eventType,
      at: event.occurredAt,
      status: doc.status === 'PENDING' ? 'IN_PROGRESS' : doc.status,
    });

    // 3) Decidir
    if (!result.ok) {
      const reason = 'reason' in event.payload ? String(event.payload.reason) : 'sin motivo';
      await this.fail(id, event.customerId, result.step, reason);
    } else {
      await this.tryComplete(id, event.customerId);
    }
  }

  // Con el primer fallo: FAILED + ActivationFailed. Si ya estaba FAILED, se ignora.
  private async fail(id: string, customerId: string, failedStep: Step, reason: string) {
    const at = new Date().toISOString();
    const failed = await this.model.findOneAndUpdate(
      { _id: id, status: { $in: ['PENDING', 'IN_PROGRESS'] } },
      {
        $set: { status: 'FAILED' },
        $push: { history: { eventType: 'ActivationFailed', at } },
      },
      { new: true },
    );
    if (!failed) return; // otro resultado ya la había dado por fallida

    this.logger.warn(`Activación ${id} FALLÓ en ${failedStep}: ${reason}`);
    await this.publisher.publish(
      createEvent('ActivationFailed', {
        correlationId: id,
        customerId,
        source: 'activation-api',
        payload: { reason, failedStep },
      }),
    );
    this.gateway.notify({ activationId: id, customerId, eventType: 'ActivationFailed', at, status: 'FAILED' });
  }

  // Con billing y provisioning OK: ACTIVE + ActivationCompleted
  private async tryComplete(id: string, customerId: string) {
    const at = new Date().toISOString();
    const done = await this.model.findOneAndUpdate(
      {
        _id: id,
        status: 'IN_PROGRESS',
        'steps.billing.status': 'OK',
        'steps.provisioning.status': 'OK',
      },
      {
        $set: { status: 'ACTIVE' },
        $push: { history: { eventType: 'ActivationCompleted', at } },
      },
      { new: true },
    );
    if (!done) return; // todavía falta el otro servicio, o ya estaba terminada

    this.logger.log(`Activación ${id} ACTIVA`);
    await this.publisher.publish(
      createEvent('ActivationCompleted', {
        correlationId: id,
        customerId,
        source: 'activation-api',
        payload: { planId: done.planId },
      }),
    );
    this.gateway.notify({ activationId: id, customerId, eventType: 'ActivationCompleted', at, status: 'ACTIVE' });
  }
}