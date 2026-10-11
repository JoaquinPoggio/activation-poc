import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Colección "billing_accounts": una cuenta simulada por activación
@Schema({ collection: 'billing_accounts', timestamps: true })
export class BillingAccount {
  @Prop({ type: String, required: true, unique: true })
  activationId!: string;

  @Prop({ type: String, required: true })
  customerId!: string;

  @Prop({ type: String, required: false })
  accountId!: string;

  @Prop({ type: String, required: true, default: 'CREATED' })
  status!: 'CREATED' | 'CANCELLED';
}

export const BillingAccountSchema = SchemaFactory.createForClass(BillingAccount);