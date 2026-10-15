import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { ClientSession } from 'mongoose';
import { createTransport } from 'nodemailer';
import type { DomainEvent } from '@app/contracts';
import { IdempotencyService } from '@app/kafka-toolkit';
import { Notification } from './notification.schema.js';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  // Mailhog recibe por SMTP en el puerto 1025, sin usuario ni contraseña
  private readonly transport = createTransport({
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    secure: false,
  });

  constructor(
    @InjectModel(Notification.name) private readonly model: Model<Notification>,
    private readonly idempotency: IdempotencyService,
  ) {}

  async onActivationCompleted(event: DomainEvent<'ActivationCompleted'>) {
    await this.handle(
      event,
      `Tu plan ${event.payload.planId} ya está activo`,
      `Hola ${event.customerId}, ¡bienvenido! Tu plan ${event.payload.planId} quedó activado (activación ${event.correlationId}).`,
    );
  }

  async onActivationFailed(event: DomainEvent<'ActivationFailed'>) {
    await this.handle(
      event,
      'No pudimos activar tu plan',
      `Hola ${event.customerId}, la activación ${event.correlationId} falló en ${event.payload.failedStep}: ${event.payload.reason}.`,
    );
  }

  private async handle(event: DomainEvent, subject: string, text: string) {
    const first = await this.idempotency.runOnce(event.eventId, (session) =>
      this.send(event, subject, text, session),
    );
    if (!first) {
      this.logger.warn(`Evento repetido ${event.eventType} [${event.correlationId}]: descartado`);
    }
  }

  private async send(event: DomainEvent, subject: string, text: string, session: ClientSession) {
    const to = `${event.customerId.toLowerCase()}@demo.local`;

    // Segunda defensa: aunque llegue otro eventId, no se manda dos veces el mismo mail a la misma activación
    const before = await this.model.findOneAndUpdate(
      { activationId: event.correlationId, eventType: event.eventType },
      { $setOnInsert: { customerId: event.customerId, to, subject } },
      { upsert: true, new: false, session },
    );
    if (before) {
      this.logger.log(`Mail de ${event.eventType} ya enviado [${event.correlationId}]`);
      return;
    }

    // Si el envío falla, se lanza el error: la transacción se cancela y el mensaje se reintenta
    await this.transport.sendMail({
      from: 'no-reply@activation-poc.local',
      to,
      subject,
      text,
    });
    this.logger.log(`Mail enviado a ${to}: "${subject}" [${event.correlationId}]`);
  }
}