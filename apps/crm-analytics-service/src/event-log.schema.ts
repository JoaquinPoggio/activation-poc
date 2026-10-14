import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Colección "event_log": una copia de cada evento recibido
@Schema({ collection: 'event_log', timestamps: true })
export class EventLog {
  @Prop({ type: String, required: true, unique: true })
  eventId!: string;

  @Prop({ type: String, required: true, index: true })
  correlationId!: string;

  @Prop({ type: String, required: true })
  eventType!: string;

  @Prop({ type: String, required: true })
  customerId!: string;

  @Prop({ type: String, required: true })
  source!: string;

  @Prop({ type: String, required: true })
  occurredAt!: string;

  // De dónde vino el mensaje en Kafka: útil para la demo
  @Prop({ type: String, required: true })
  topic!: string;

  @Prop({ type: Number, required: true })
  partition!: number;

  @Prop({ type: String, required: true })
  offset!: string;

  @Prop({ type: Object, default: {} })
  payload!: Record<string, unknown>;
}

export const EventLogSchema = SchemaFactory.createForClass(EventLog);