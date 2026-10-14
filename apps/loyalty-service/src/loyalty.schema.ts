import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

// Colección "loyalty_points": puntos acumulados por cliente
@Schema({ collection: 'loyalty_points', timestamps: true })
export class LoyaltyAccount {
  @Prop({ type: String, required: true, unique: true })
  customerId!: string;

  @Prop({ type: Number, default: 0 })
  points!: number;

  @Prop({ type: Number, default: 0 })
  activations!: number;
}

export const LoyaltyAccountSchema = SchemaFactory.createForClass(LoyaltyAccount);