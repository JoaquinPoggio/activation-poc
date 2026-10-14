import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Colección "processed_events": los eventId que este servicio ya procesó
@Schema({ collection: 'processed_events' })
export class ProcessedEvent {
  @Prop({ type: String, required: true, unique: true })
  eventId!: string;

  // TTL de 7 días: coincide con la retención de los topics, un evento más viejo ya no puede llegar
  @Prop({ type: Date, default: () => new Date(), expires: 60 * 60 * 24 * 7 })
  createdAt!: Date;
}

export const ProcessedEventSchema = SchemaFactory.createForClass(ProcessedEvent);