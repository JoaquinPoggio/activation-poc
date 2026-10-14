import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';
import { Topics, type DomainEvent } from '@app/contracts';
import { ResilientConsumer } from '@app/kafka-toolkit';
import { NotificationService } from './notification.service.js';

@Controller()
export class NotificationController {
  constructor(
    private readonly notification: NotificationService,
    private readonly resilient: ResilientConsumer,
  ) {}

  @EventPattern(Topics.ACTIVATION_EVENTS)
  handleActivationEvent(@Payload() event: DomainEvent, @Ctx() ctx: unknown) {
    if (event?.eventType === 'ActivationCompleted') {
      return this.resilient.run(event, ctx, () =>
        this.notification.onActivationCompleted(event as DomainEvent<'ActivationCompleted'>),
      );
    }
    if (event?.eventType === 'ActivationFailed') {
      return this.resilient.run(event, ctx, () =>
        this.notification.onActivationFailed(event as DomainEvent<'ActivationFailed'>),
      );
    }
  }
}