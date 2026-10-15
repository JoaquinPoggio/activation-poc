import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import type { KafkaContext } from '@nestjs/microservices';
import type { Model } from 'mongoose';
import type { DomainEvent } from '@app/contracts';
import { EventLog } from './event-log.schema.js';

@Injectable()
export class CrmAnalyticsService {
  private readonly logger = new Logger(CrmAnalyticsService.name);

  constructor(@InjectModel(EventLog.name) private readonly model: Model<EventLog>) {}

  async record(event: DomainEvent, rawCtx: unknown) {
    const ctx = rawCtx as KafkaContext;
    const topic = ctx.getTopic();
    const partition = ctx.getPartition();
    const offset = ctx.getMessage().offset;

    // upsert por eventId: si el evento ya estaba guardado (reproceso o duplicado), no se repite
    const res = await this.model.updateOne(
      { eventId: event.eventId },
      {
        $setOnInsert: {
          correlationId: event.correlationId,
          eventType: event.eventType,
          customerId: event.customerId,
          source: event.source,
          occurredAt: event.occurredAt,
          topic,
          partition,
          offset,
          payload: event.payload,
        },
      },
      { upsert: true },
    );

    const where = `${topic} p${partition} o${offset}`;
    if (res.upsertedCount === 0) {
      this.logger.debug(`Ya registrado ${event.eventType} [${event.correlationId}] (${where})`);
      return;
    }
    this.logger.log(`Registrado ${event.eventType} [${event.correlationId}] (${where})`);
  }
}