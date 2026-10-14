import { Controller } from '@nestjs/common';
import { Ctx, EventPattern, KafkaContext, Payload } from '@nestjs/microservices';
import { Topics, type DomainEvent } from '@app/contracts';
import { ResilientConsumer } from '@app/kafka-toolkit';
import { CrmAnalyticsService } from './crm-analytics.service.js';

@Controller()
export class CrmAnalyticsController {
  constructor(
    private readonly crm: CrmAnalyticsService,
    private readonly resilient: ResilientConsumer,
  ) {}

  // Se suscribe a TODOS los topics de negocio
  @EventPattern(Topics.ACTIVATION_REQUESTED)
  onRequested(@Payload() event: DomainEvent, @Ctx() ctx: unknown) {
    return this.resilient.run(event, ctx, () => this.crm.record(event, ctx));
  }

  @EventPattern(Topics.BILLING_EVENTS)
  onBilling(@Payload() event: DomainEvent, @Ctx() ctx: unknown) {
    return this.resilient.run(event, ctx, () => this.crm.record(event, ctx));
  }

  @EventPattern(Topics.PROVISIONING_EVENTS)
  onProvisioning(@Payload() event: DomainEvent, @Ctx() ctx: unknown) {
    return this.resilient.run(event, ctx, () => this.crm.record(event, ctx));
  }

  @EventPattern(Topics.ACTIVATION_EVENTS)
  onActivation(@Payload() event: DomainEvent, @Ctx() ctx: unknown) {
    return this.resilient.run(event, ctx, () => this.crm.record(event, ctx));
  }
}