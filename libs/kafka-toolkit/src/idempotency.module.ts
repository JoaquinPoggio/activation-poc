import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IdempotencyService } from './idempotency.service.js';
import { ProcessedEvent, ProcessedEventSchema } from './processed-event.schema.js';

// Cada servicio lo importa y usa SU propia base de Mongo (el módulo toma la conexión del servicio)
@Module({
  imports: [
    MongooseModule.forFeature([{ name: ProcessedEvent.name, schema: ProcessedEventSchema }]),
  ],
  providers: [IdempotencyService],
  exports: [IdempotencyService],
})
export class IdempotencyModule {}