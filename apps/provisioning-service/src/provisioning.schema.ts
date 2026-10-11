import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Colección "provisioning_orders": una orden simulada por activación
@Schema({ collection: 'provisioning_orders', timestamps: true })
export class ProvisioningOrder {
  @Prop({ type: String, required: true, unique: true })
  activationId!: string;

  @Prop({ type: String, required: true })
  customerId!: string;

  @Prop({ type: String, required: true })
  orderId!: string;

  @Prop({ type: String, required: true, default: 'COMPLETED' })
  status!: 'COMPLETED';
}

export const ProvisioningOrderSchema = SchemaFactory.createForClass(ProvisioningOrder);