import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';
import { Topics, type DomainEvent } from '@app/contracts';
import { ResilientConsumer } from '@app/kafka-toolkit';
import { ActivationSagaService } from './saga.service.js';

@Controller()
export class ActivationEventsController {
  constructor(
    private readonly saga: ActivationSagaService,
    private readonly resilient: ResilientConsumer,
  ) {}

  @EventPattern(Topics.BILLING_EVENTS)
  onBillingEvent(@Payload() event: DomainEvent, @Ctx() ctx: unknown) {
    return this.resilient.run(event, ctx, () => this.saga.onServiceEvent(event));
  }

  @EventPattern(Topics.PROVISIONING_EVENTS)
  onProvisioningEvent(@Payload() event: DomainEvent, @Ctx() ctx: unknown) {
    return this.resilient.run(event, ctx, () => this.saga.onServiceEvent(event));
  }
}