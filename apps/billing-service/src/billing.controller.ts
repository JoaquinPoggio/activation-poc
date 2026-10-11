import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Topics, type DomainEvent } from '@app/contracts';
import { BillingService } from './billing.service.js';

@Controller()
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  @EventPattern(Topics.ACTIVATION_REQUESTED)
  handleActivationRequested(@Payload() event: DomainEvent<'ActivationRequested'>) {
    return this.billing.onActivationRequested(event);
  }

  // activation.events también trae ActivationCompleted; billing solo reacciona al fallo
  @EventPattern(Topics.ACTIVATION_EVENTS)
  handleActivationEvent(@Payload() event: DomainEvent) {
    if (event.eventType === 'ActivationFailed') {
      return this.billing.onActivationFailed(event as DomainEvent<'ActivationFailed'>);
    }
  }
}