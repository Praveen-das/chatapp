// Kafka domain topics and envelope types

export const KAFKA_TOPICS = {
  MESSAGES: "chat.messages",
  CONVERSATIONS: "chat.conversations",
  GROUPS: "chat.groups",
  USERS: "chat.users",
  SYSTEM: "chat.system",
} as const;

export type KafkaTopic = (typeof KAFKA_TOPICS)[keyof typeof KAFKA_TOPICS];

export type KafkaEnvelope<T = unknown> = {
  action: string;
  timestamp: number;
  payload: T;
};

export function createEnvelope<T>(action: string, payload: T): KafkaEnvelope<T> {
  return {
    action,
    timestamp: Date.now(),
    payload,
  };
}
