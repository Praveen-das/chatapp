import redisClient from "../redis/client";

interface ActiveStreamData {
  streamId: string;
  result?: string;
}

/**
 * Store the active stream ID and text for a conversation
 * @param conversationId - The conversation ID
 * @param streamId - The active stream ID (or null to clear)
 * @param result - Optional text to store with the stream
 */
export async function saveActiveStreamId({
  conversationId,
  ...rest
}: {
  conversationId: string;
  streamId?: string;
  result?: string;
}): Promise<void> {
  const key = `chat:${conversationId}:activeStream`;

  const value = Object.entries(rest).reduce<string[]>((acc, [key, value]) => {
    acc.push(key, value);
    return acc;
  }, []);

  // Store with 24-hour expiration to prevent stale streams
  await redisClient.hset(key, value);
}

/**
 * Get the active stream ID for a conversation
 * @param conversationId - The conversation ID
 * @returns The active stream ID or null if none exists
 */
export async function getActiveStream(conversationId: string) {
  const key = `chat:${conversationId}:activeStream`;

  try {
    const data = await redisClient.hgetall(key);
    return data;
  } catch (error: any) {
    console.log("error getActiveStream:", error.message, "\n", `key :${key}`);
    return null;
  }
}

/**
 * Get the complete active stream data for a conversation
 * @param conversationId - The conversation ID
 * @returns The active stream data or null if none exists
 */
export async function deleteActiveStream(conversationId: string) {
  const key = `chat:${conversationId}:activeStream`;
  const data = await redisClient.del(key);
}
