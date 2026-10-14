import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, Payload } from '@nestjs/microservices';
import { Topics, type DomainEvent } from '@app/contracts';
import { ResilientConsumer } from '@app/kafka-toolkit';
import { LoyaltyService } from './loyalty.service.js';

@Controller()
export class LoyaltyController {
  constructor(
    private readonly loyalty: LoyaltyService,
    private readonly resilient: ResilientConsumer,
  ) {}

  // activation.events trae Completed y Failed; loyalty solo premia las exitosas
  @EventPattern(Topics.ACTIVATION_EVENTS)
  handleActivationEvent(@Payload() event: DomainEvent, @Ctx() ctx: unknown) {
    if (event?.eventType === 'ActivationCompleted') {
      return this.resilient.run(event, ctx, () =>
        this.loyalty.onActivationCompleted(event as DomainEvent<'ActivationCompleted'>),
      );
    }
  }
}