import { Topics, TopicName } from './topics.js';

function randomUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const randomValue = Math.floor(Math.random() * 16);
    const value = character === 'x' ? randomValue : (randomValue & 0x3) | 0x8;
    return value.toString(16);
  });
}

export const EVENT_VERSION = 1;

export type SimulateFailure = 'none' | 'billing' | 'provisioning';

// Eventos nombrados en pasado: describen un hecho
export const EventType = {
  ActivationRequested: 'ActivationRequested',
  BillingAccountCreated: 'BillingAccountCreated',
  BillingFailed: 'BillingFailed',
  BillingAccountCancelled: 'BillingAccountCancelled',
  ProvisioningCompleted: 'ProvisioningCompleted',
  ProvisioningFailed: 'ProvisioningFailed',
  ActivationCompleted: 'ActivationCompleted',
  ActivationFailed: 'ActivationFailed',
} as const;

export type EventType = (typeof EventType)[keyof typeof EventType];

// Payload de cada evento
export interface PayloadMap {
  ActivationRequested: {
    planId: string;
    channel: string;
    simulateFailure: SimulateFailure;
  };
  BillingAccountCreated: { accountId: string };
  BillingFailed: { reason: string };
  BillingAccountCancelled: { accountId?: string; reason: string };
  ProvisioningCompleted: { orderId: string };
  ProvisioningFailed: { reason: string };
  ActivationCompleted: { planId: string };
  ActivationFailed: {
    reason: string;
    failedStep: 'billing' | 'provisioning';
  };
}

// Sobre común a todos los eventos
export interface DomainEvent<T extends EventType = EventType> {
  eventId: string; // base de la idempotencia
  eventType: T;
  version: number; // permite evolucionar el contrato
  occurredAt: string; // ISO 8601
  correlationId: string; // = activationId
  customerId: string; // también es la clave del mensaje en Kafka
  source: string; // servicio que publicó
  payload: PayloadMap[T];
}

// En qué topic se publica cada evento
export const EventTopic: Record<EventType, TopicName> = {
  ActivationRequested: Topics.ACTIVATION_REQUESTED,
  BillingAccountCreated: Topics.BILLING_EVENTS,
  BillingFailed: Topics.BILLING_EVENTS,
  BillingAccountCancelled: Topics.BILLING_EVENTS,
  ProvisioningCompleted: Topics.PROVISIONING_EVENTS,
  ProvisioningFailed: Topics.PROVISIONING_EVENTS,
  ActivationCompleted: Topics.ACTIVATION_EVENTS,
  ActivationFailed: Topics.ACTIVATION_EVENTS,
};

// Fábrica: arma el sobre completo para que ningún servicio lo haga a mano
export function createEvent<T extends EventType>(
  eventType: T,
  params: {
    correlationId: string;
    customerId: string;
    source: string;
    payload: PayloadMap[T];
  },
): DomainEvent<T> {
  return {
    eventId: randomUUID(),
    eventType,
    version: EVENT_VERSION,
    occurredAt: new Date().toISOString(),
    ...params,
  };
}