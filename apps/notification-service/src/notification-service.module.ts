import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './notification.schema.js';
import { NotificationController } from './notification.controller.js';
import { NotificationService } from './notification.service.js';

@Module({
  imports: [
    MongooseModule.forRoot(
      process.env.MONGO_URI ?? 'mongodb://localhost:27017/notification?directConnection=true',
    ),
    MongooseModule.forFeature([{ name: Notification.name, schema: NotificationSchema }]),
  ],
  controllers: [NotificationController],
  providers: [NotificationService],
})
export class NotificationServiceModule {}