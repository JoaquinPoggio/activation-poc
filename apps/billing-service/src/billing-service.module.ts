import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KafkaToolkitModule, IdempotencyModule } from '@app/kafka-toolkit';
import { BillingAccount, BillingAccountSchema } from './billing.schema.js';
import { BillingController } from './billing.controller.js';
import { BillingService } from './billing.service.js';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI ?? 'mongodb://localhost:27017/billing?directConnection=true',
    ),
    MongooseModule.forFeature([
      { name: BillingAccount.name, schema: BillingAccountSchema },
    ]),
    KafkaToolkitModule.forService('billing-service'),
    IdempotencyModule,
  ],
  controllers: [BillingController],
  providers: [BillingService],
})
export class BillingServiceModule {}