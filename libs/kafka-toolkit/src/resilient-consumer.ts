import { Inject, Injectable, Logger } from '@nestjs/common';
import type { KafkaContext } from '@nestjs/microservices';
import { dlqOf } from '@app/contracts';
import { EventPublisher } from './event-publisher.js';

export const SERVICE_NAME = 'SERVICE_NAME';

// Esperas entre reintentos (RNF-04): 1 s, 2 s y 4 s
export const RETRY_DELAYS_MS = [1000, 2000, 4000];

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const reasonOf = (err: unknown) =>
  (err instanceof Error ? err.message : String(err)).slice(0, 500);

// Descripción para los logs; tolera mensajes inválidos (sin eventType ni correlationId)
function describe(event: unknown): string {
  const e = event as { eventType?: string; correlationId?: string } | null;
  return `${e?.eventType ?? 'mensaje inválido'} [${e?.correlationId ?? 's/correlationId'}]`;
}

@Injectable()
export class ResilientConsumer {
  private readonly logger = new Logger(ResilientConsumer.name);

  constructor(
    private readonly publisher: EventPublisher,
    @Inject(SERVICE_NAME) private readonly serviceName: string,
  ) {}

  /**
   * Ejecuta el handler. Si falla, reintenta con espera creciente.
   * Si sigue fallando, manda el mensaje original a <topic>.dlq y vuelve normalmente:
   * así Kafka confirma el offset y la partición sigue con el próximo mensaje.
   */
  async run(event: unknown, ctx: unknown, handler: () => Promise<unknown>): Promise<void> {
    const attempts = RETRY_DELAYS_MS.length + 1; // 1 intento inicial + 3 reintentos
    let lastError: unknown;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        await handler();
        return;
      } catch (err) {
        lastError = err;
        const delay = RETRY_DELAYS_MS[attempt - 1];
        if (delay === undefined) break; // era el último intento
        this.logger.warn(
          `${describe(event)} falló (intento ${attempt}/${attempts}): ${reasonOf(err)}. Reintento en ${delay / 1000} s`,
        );
        await sleep(delay);
      }
    }

    await this.sendToDlq(event, ctx as KafkaContext, lastError, attempts);
  }

  private async sendToDlq(event: unknown, ctx: KafkaContext, err: unknown, attempts: number) {
    const topic = ctx.getTopic();
    const raw = ctx.getMessage() as { key?: unknown; offset?: string };
    const key =
      raw.key != null ? String(raw.key) : (event as { customerId?: string } | null)?.customerId;
    const value = typeof event === 'string' ? event : JSON.stringify(event);
    const dlq = dlqOf(topic);

    await this.publisher.publishRaw(dlq, {
      key,
      value,
      headers: {
        'x-error-reason': reasonOf(err),
        'x-failed-service': this.serviceName,
        'x-original-topic': topic,
        'x-original-partition': String(ctx.getPartition()),
        'x-original-offset': String(raw.offset ?? ''),
        'x-attempts': String(attempts),
      },
    });
    this.logger.error(`${describe(event)} enviado a ${dlq} tras ${attempts} intentos`);
  }
}