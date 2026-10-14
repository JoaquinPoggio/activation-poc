import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';
import { Topics, type DomainEvent } from '@app/contracts';
import { ResilientConsumer } from '@app/kafka-toolkit';
import { ProvisioningService } from './provisioning.service.js';

@Controller()
export class ProvisioningController {
  constructor(
    private readonly provisioning: ProvisioningService,
    private readonly resilient: ResilientConsumer,
  ) {}

  @EventPattern(Topics.ACTIVATION_REQUESTED)
  handleActivationRequested(
    @Payload() event: DomainEvent<'ActivationRequested'>,
    @Ctx() ctx: unknown,
  ) {
    return this.resilient.run(event, ctx, () => this.provisioning.onActivationRequested(event));
  }
}   