import { randomUUID } from 'crypto';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createEvent } from '@app/contracts';
import { EventPublisher } from '@app/kafka-toolkit';
import { Activation } from './activation.schema.js';
import { CreateActivationDto } from './create-activation.dto.js';

@Injectable()
export class ActivationsService {
  constructor(
    @InjectModel(Activation.name) private readonly model: Model<Activation>,
    private readonly publisher: EventPublisher,
  ) {}

  async create(dto: CreateActivationDto) {
    const activationId = `act-${randomUUID().slice(0, 8)}`;
    const simulateFailure = dto.simulateFailure ?? 'none';

    const event = createEvent('ActivationRequested', {
      correlationId: activationId,
      customerId: dto.customerId,
      source: 'activation-api',
      payload: {
        planId: dto.planId,
        channel: dto.channel ?? 'web',
        simulateFailure,
      },
    });

    // 1) Guardar la activación en estado PENDING
    await this.model.create({
      _id: activationId,
      customerId: dto.customerId,
      planId: dto.planId,
      status: 'PENDING',
      simulateFailure,
      steps: {},
      history: [{ eventType: event.eventType, at: event.occurredAt }],
    });

    // 2) Publicar el evento. Fases 1 a 3: publicación directa después de guardar.
    //    Riesgo documentado: si la API se cae entre 1) y 2), el evento se pierde.
    //    En la fase 4 se resuelve con el outbox.
    await this.publisher.publish(event);

    return { activationId, status: 'PENDING' as const };
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).lean();
    if (!doc) throw new NotFoundException(`Activación ${id} no encontrada`);
    return doc;
  }
}