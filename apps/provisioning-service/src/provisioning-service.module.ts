import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KafkaToolkitModule } from '@app/kafka-toolkit';
import { ProvisioningOrder, ProvisioningOrderSchema } from './provisioning.schema.js';
import { ProvisioningController } from './provisioning.controller.js';
import { ProvisioningService } from './provisioning.service.js';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI ?? 'mongodb://localhost:27017/provisioning?directConnection=true',
    ),
    MongooseModule.forFeature([
      { name: ProvisioningOrder.name, schema: ProvisioningOrderSchema },
    ]),
    KafkaToolkitModule.forService('provisioning-service'),
  ],
  controllers: [ProvisioningController],
  providers: [ProvisioningService],
})
export class ProvisioningServiceModule {}