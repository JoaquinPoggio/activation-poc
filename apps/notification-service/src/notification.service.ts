import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createTransport } from 'nodemailer';
import type { DomainEvent } from '@app/contracts';
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
  ) {}

  async onActivationCompleted(event: DomainEvent<'ActivationCompleted'>) {
    await this.send(
      event,
      `Tu plan ${event.payload.planId} ya está activo`,
      `Hola ${event.customerId}, ¡bienvenido! Tu plan ${event.payload.planId} quedó activado (activación ${event.correlationId}).`,
    );
  }

  async onActivationFailed(event: DomainEvent<'ActivationFailed'>) {
    await this.send(
      event,
      'No pudimos activar tu plan',
      `Hola ${event.customerId}, la activación ${event.correlationId} falló en ${event.payload.failedStep}: ${event.payload.reason}.`,
    );
  }

  private async send(event: DomainEvent, subject: string, text: string) {
    const to = `${event.customerId.toLowerCase()}@demo.local`;

    // Registra el envío ANTES de mandar. Si ya existía, es un evento repetido: no se reenvía.
    const before = await this.model.findOneAndUpdate(
      { activationId: event.correlationId, eventType: event.eventType },
      { $setOnInsert: { customerId: event.customerId, to, subject } },
      { upsert: true, new: false },
    );
    if (before) {
      this.logger.log(`Mail de ${event.eventType} ya enviado [${event.correlationId}]`);
      return;
    }

    await this.transport.sendMail({
      from: 'no-reply@activation-poc.local',
      to,
      subject,
      text,
    });
    this.logger.log(`Mail enviado a ${to}: "${subject}" [${event.correlationId}]`);
  }
}