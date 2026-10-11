import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import type { SimulateFailure } from '@app/contracts';

export type ActivationStatus = 'PENDING' | 'IN_PROGRESS' | 'ACTIVE' | 'FAILED';

// Colección "activations": un documento por activación (sección 07 del documento)
@Schema({ collection: 'activations', _id: false, timestamps: true })
export class Activation {
  @Prop({ type: String })
  _id!: string; // = activationId = correlationId

  @Prop({ type: String, required: true, index: true })
  customerId!: string;

  @Prop({ type: String, required: true })
  planId!: string;

  @Prop({ type: String, required: true, default: 'PENDING' })
  status!: ActivationStatus;

  @Prop({ type: String, default: 'none' })
  simulateFailure!: SimulateFailure;

  // Resultado parcial de cada servicio; lo completaremos al consumir eventos
  @Prop({ type: Object, default: {} })
  steps!: {
    billing?: { status: 'OK' | 'FAILED'; at: string };
    provisioning?: { status: 'OK' | 'FAILED'; at: string };
  };

  // Historial de eventos: es lo que va a mostrar la timeline
  @Prop({ type: [Object], default: [] })
  history!: { eventType: string; at: string }[];
}

export const ActivationSchema = SchemaFactory.createForClass(Activation);