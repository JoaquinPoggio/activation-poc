import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { DomainEvent } from '@app/contracts';
import { IdempotencyService } from '@app/kafka-toolkit';
import { LoyaltyAccount } from './loyalty.schema.js';

const POINTS_PER_ACTIVATION = 100;

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(
    @InjectModel(LoyaltyAccount.name) private readonly model: Model<LoyaltyAccount>,
    private readonly idempotency: IdempotencyService,
  ) {}

  async onActivationCompleted(event: DomainEvent<'ActivationCompleted'>) {
    const first = await this.idempotency.runOnce(event.eventId, async (session) => {
      await this.model.updateOne(
        { customerId: event.customerId },
        { $inc: { points: POINTS_PER_ACTIVATION, activations: 1 } },
        { upsert: true, session },
      );
      this.logger.log(`+${POINTS_PER_ACTIVATION} puntos para ${event.customerId} [${event.correlationId}]`);
    });
    if (!first) {
      this.logger.warn(`Evento repetido ${event.eventType} [${event.correlationId}]: descartado`);
    }
  }
}