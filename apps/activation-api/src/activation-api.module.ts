import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KafkaToolkitModule } from '@app/kafka-toolkit';
import { Activation, ActivationSchema } from './activation.schema.js';
import { ActivationsController } from './activations.controller.js';
import { ActivationsService } from './activations.service.js';
import { ActivationEventsController } from './activation-events.controller.js';
import { ActivationSagaService } from './saga.service.js';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI ??
        'mongodb://localhost:27017/activation-api?directConnection=true',
    ),
    MongooseModule.forFeature([{ name: Activation.name, schema: ActivationSchema }]),
    KafkaToolkitModule.forService('activation-api'),
  ],
  controllers: [ActivationsController, ActivationEventsController],
  providers: [ActivationsService, ActivationSagaService],
})
export class ActivationApiModule {}