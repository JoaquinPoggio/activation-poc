import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Topics, type DomainEvent } from '@app/contracts';
import { ActivationSagaService } from './saga.service.js';

@Controller()
export class ActivationEventsController {
  constructor(private readonly saga: ActivationSagaService) {}

  @EventPattern(Topics.BILLING_EVENTS)
  onBillingEvent(@Payload() event: DomainEvent) {
    return this.saga.onServiceEvent(event);
  }

  @EventPattern(Topics.PROVISIONING_EVENTS)
  onProvisioningEvent(@Payload() event: DomainEvent) {
    return this.saga.onServiceEvent(event);
  }
}