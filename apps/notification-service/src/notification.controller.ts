import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Topics, type DomainEvent } from '@app/contracts';
import { NotificationService } from './notification.service.js';

@Controller()
export class NotificationController {
  constructor(private readonly notification: NotificationService) {}

  @EventPattern(Topics.ACTIVATION_EVENTS)
  handleActivationEvent(@Payload() event: DomainEvent) {
    if (event.eventType === 'ActivationCompleted') {
      return this.notification.onActivationCompleted(event as DomainEvent<'ActivationCompleted'>);
    }
    if (event.eventType === 'ActivationFailed') {
      return this.notification.onActivationFailed(event as DomainEvent<'ActivationFailed'>);
    }
  }
}