import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { Topics, type DomainEvent } from '@app/contracts';
import { ProvisioningService } from './provisioning.service.js';

@Controller()
export class ProvisioningController {
  constructor(private readonly provisioning: ProvisioningService) {}

  @EventPattern(Topics.ACTIVATION_REQUESTED)
  handleActivationRequested(@Payload() event: DomainEvent<'ActivationRequested'>) {
    return this.provisioning.onActivationRequested(event);
  }
}