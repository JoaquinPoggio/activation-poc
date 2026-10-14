import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KafkaToolkitModule, IdempotencyModule } from '@app/kafka-toolkit';
import { LoyaltyAccount, LoyaltyAccountSchema } from './loyalty.schema.js';
import { LoyaltyController } from './loyalty.controller.js';
import { LoyaltyService } from './loyalty.service.js';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI ?? 'mongodb://localhost:27017/loyalty?directConnection=true',
    ),
    MongooseModule.forFeature([{ name: LoyaltyAccount.name, schema: LoyaltyAccountSchema }]),
    KafkaToolkitModule.forService('loyalty-service'),
    IdempotencyModule,
  ],
  controllers: [LoyaltyController],
  providers: [LoyaltyService],
})
export class LoyaltyServiceModule {}
