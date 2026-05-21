import { KAFKA_TOPICS } from "@repo/kafka";

export const topics = [
  KAFKA_TOPICS.CONVERSATIONS,
  KAFKA_TOPICS.GROUPS,
  KAFKA_TOPICS.USERS,
];

export const messageTopic = KAFKA_TOPICS.MESSAGES;
