import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { KafkaToolkitModule } from '@app/kafka-toolkit';
import { EventLog, EventLogSchema } from './event-log.schema.js';
import { CrmAnalyticsController } from './crm-analytics.controller.js';
import { CrmAnalyticsService } from './crm-analytics.service.js';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI ?? 'mongodb://localhost:27017/crm-analytics?directConnection=true',
    ),
    MongooseModule.forFeature([{ name: EventLog.name, schema: EventLogSchema }]),
    KafkaToolkitModule.forService('crm-analytics-service'),
  ],
  controllers: [CrmAnalyticsController],
  providers: [CrmAnalyticsService],
})
export class CrmAnalyticsServiceModule {}