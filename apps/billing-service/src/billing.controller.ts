import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';
import { Topics, type DomainEvent } from '@app/contracts';
import { ResilientConsumer } from '@app/kafka-toolkit';
import { BillingService } from './billing.service.js';

@Controller()
export class BillingController {
  constructor(
    private readonly billing: BillingService,
    private readonly resilient: ResilientConsumer,
  ) {}

  @EventPattern(Topics.ACTIVATION_REQUESTED)
  handleActivationRequested(
    @Payload() event: DomainEvent<'ActivationRequested'>,
    @Ctx() ctx: unknown,
  ) {
    return this.resilient.run(event, ctx, () => this.billing.onActivationRequested(event));
  }

  // activation.events también trae ActivationCompleted; billing solo reacciona al fallo
  @EventPattern(Topics.ACTIVATION_EVENTS)
  handleActivationEvent(@Payload() event: DomainEvent, @Ctx() ctx: unknown) {
    if (event?.eventType === 'ActivationFailed') {
      return this.resilient.run(event, ctx, () =>
        this.billing.onActivationFailed(event as DomainEvent<'ActivationFailed'>),
      );
    }
  }
}