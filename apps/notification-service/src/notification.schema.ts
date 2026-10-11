import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Colección "notifications": un registro por email enviado
@Schema({ collection: 'notifications', timestamps: true })
export class Notification {
  @Prop({ type: String, required: true })
  activationId!: string;

  @Prop({ type: String, required: true })
  eventType!: string;

  @Prop({ type: String, required: true })
  customerId!: string;

  @Prop({ type: String, required: true })
  to!: string;

  @Prop({ type: String, required: true })
  subject!: string;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Índice del documento: activationId + eventType, único. Evita mandar dos veces el mismo mail.
NotificationSchema.index({ activationId: 1, eventType: 1 }, { unique: true });