export interface KafkaEnv {
  brokers: string[];
  clientId: string;
  groupId: string;
}

// Lee las variables de entorno comunes del documento (KAFKA_BROKERS, KAFKA_CLIENT_ID, KAFKA_GROUP_ID).
// Si no están definidas, usa valores pensados para correr desde tu Windows.
export function kafkaEnv(defaults: { clientId: string; groupId: string }): KafkaEnv {
  return {
    brokers: (process.env.KAFKA_BROKERS ?? 'localhost:9092')
      .split(',')
      .map((b) => b.trim()),
    clientId: process.env.KAFKA_CLIENT_ID ?? defaults.clientId,
    groupId: process.env.KAFKA_GROUP_ID ?? defaults.groupId,
  };
}