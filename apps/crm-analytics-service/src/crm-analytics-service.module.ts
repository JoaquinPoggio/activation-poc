import { Module } from '@nestjs/common';
import { CrmAnalyticsServiceController } from './crm-analytics-service.controller.js';
import { CrmAnalyticsServiceService } from './crm-analytics-service.service.js';

@Module({
  imports: [],
  controllers: [CrmAnalyticsServiceController],
  providers: [CrmAnalyticsServiceService],
})
export class CrmAnalyticsServiceModule {}
