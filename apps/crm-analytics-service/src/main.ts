import { NestFactory } from '@nestjs/core';
import { CrmAnalyticsServiceModule } from './crm-analytics-service.module.js';

async function bootstrap() {
  const app = await NestFactory.create(CrmAnalyticsServiceModule);
  await app.listen(process.env.port ?? 3000);
}
await bootstrap();
