// Nombres de topics: dominio.tipo (convención del documento)
export const Topics = {
  ACTIVATION_REQUESTED: 'activation.requested',
  BILLING_EVENTS: 'billing.events',
  PROVISIONING_EVENTS: 'provisioning.events',
  ACTIVATION_EVENTS: 'activation.events',
} as const;

export type TopicName = (typeof Topics)[keyof typeof Topics];

// Cada topic tiene su DLQ: <topic>.dlq
export const dlqOf = (topic: string): string => `${topic}.dlq`;