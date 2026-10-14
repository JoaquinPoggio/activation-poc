import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import type { ClientSession } from 'mongoose';
import { ProcessedEvent } from './processed-event.schema.js';

// ¿El error es "este eventId ya estaba registrado"?
function isDuplicateEvent(err: unknown): boolean {
  const e = err as { code?: number; keyPattern?: Record<string, unknown> };
  return e?.code === 11000 && !!e.keyPattern && 'eventId' in e.keyPattern;
}

@Injectable()
export class IdempotencyService implements OnModuleInit {
  constructor(
    @InjectModel(ProcessedEvent.name) private readonly processed: Model<ProcessedEvent>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  // Asegura que el índice único exista ANTES de recibir el primer mensaje
  async onModuleInit(): Promise<void> {
    await this.processed.init();
  }

  /**
   * Ejecuta `effect` una sola vez por eventId.
   * Registra el eventId y corre el efecto en la MISMA transacción de Mongo.
   * Devuelve true si lo ejecutó y false si el evento ya estaba procesado.
   */
  async runOnce(
    eventId: string,
    effect: (session: ClientSession) => Promise<void>,
  ): Promise<boolean> {
    const session = await this.connection.startSession();
    try {
      await session.withTransaction(async () => {
        await this.processed.create([{ eventId }], { session });
        await effect(session);
      });
      return true;
    } catch (err) {
      if (isDuplicateEvent(err)) return false; // evento repetido: se descarta
      throw err;
    } finally {
      await session.endSession();
    }
  }
}