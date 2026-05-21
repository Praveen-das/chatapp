import { google } from "@ai-sdk/google";
import { UIMessage } from "@interfaces/aiInterface";
import {
  convertToModelMessages,
  generateId,
  safeValidateUIMessages,
  simulateReadableStream,
  smoothStream,
  streamText,
} from "ai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createResumableStreamContext } from "resumable-stream/ioredis";
import { deleteActiveStream, saveActiveStreamId } from "@lib/stream-store";
import { systemInstruction } from "./s_prompt";
import { publisher, subscriber } from "../../../redis/client";
import { produceMessage, createEnvelope, KAFKA_TOPICS } from "@repo/kafka";

// Polyfill for Next.js 14 compatibility (Next.js 15+ has native 'after' function)
// This simply executes the promise without deferring it
const waitUntilPolyfill = (promise: Promise<unknown>) => {
  promise.catch((error) => {
    console.error("Background task error:", error);
  });
};

// Opt out of caching; every request should send a new event
export const dynamic = "force-dynamic";

// IMessageReply schema (recursive reference handled with z.lazy)
const messageReplySchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    messageId: z.string(),
    userId: z.string(),
    message: z.string(),
  })
);

// IMessage metadata schema
const messageMetadataSchema = z
  .object({
    id: z.string().min(1, "Message ID is required"),
    conversationId: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    message: z.string(),
    type: z.enum(["message", "placeholder", "service_message", "notification", "generating"]),
    timestamp: z.number().positive("Timestamp must be positive"),
    deleted: z.boolean(),
    reply: messageReplySchema.optional(),
  })
  .strip();

// Zod schema for request body fields
const requestBodySchema = z.object({
  id: z.string().min(1, "Chat ID is required"), // Chat ID from useChat hook
  messages: z.array(z.any()).min(1, "At least one message is required"),
  conversationId: z.string().min(1, "Conversation ID is required"),
  userId: z.string().min(1, "User ID is required"),
  msgId: z.string().min(1, "Message ID is required"),
  messageTimestamp: z.number().positive("Message timestamp must be positive"),
});

export async function POST(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json();

    // Validate request body structure
    const bodyValidation = requestBodySchema.safeParse(body);

    if (!bodyValidation.success) {
      return NextResponse.json(
        {
          error: "Invalid request body",
          details: bodyValidation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { id, messages, conversationId, userId, msgId, messageTimestamp } = bodyValidation.data;

    // Clear any previous active stream for this chat
    await deleteActiveStream(conversationId);

    // Validate UI messages with metadata schema
    const messagesValidation = await safeValidateUIMessages({
      messages,
      metadataSchema: messageMetadataSchema.optional(),
    });

    if (!messagesValidation.success) {
      return NextResponse.json(
        {
          error: "Invalid messages format",
          details: messagesValidation.error,
        },
        { status: 400 }
      );
    }

    const validatedMessages = messagesValidation.data as UIMessage[];
    let message = "";

    await produceMessage(
      createEnvelope("SAVE", { messages: [validatedMessages.at(-1)?.metadata] }),
      KAFKA_TOPICS.MESSAGES,
      conversationId
    );

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemInstruction,
      messages: convertToModelMessages(validatedMessages),
      experimental_transform: smoothStream({
        delayInMs: 100, // optional: defaults to 10ms
        chunking: "line", // optional: defaults to 'word'
      }),
    });

    // const result = streamText({
    //   model: new MockLanguageModelV2({
    //     doStream: async () => ({
    //       stream: simulateReadableStream({
    //         chunks: [
    //           { type: "text-start", id: msgId },

    //           { type: "text-delta", id: msgId, delta: "The quiet " },
    //           { type: "text-delta", id: msgId, delta: "hum " },
    //           { type: "text-delta", id: msgId, delta: "of morning " },
    //           { type: "text-delta", id: msgId, delta: "light,\n" },

    //           { type: "text-delta", id: msgId, delta: "Spills gold " },
    //           { type: "text-delta", id: msgId, delta: "on fields, " },
    //           { type: "text-delta", id: msgId, delta: "chases the " },
    //           { type: "text-delta", id: msgId, delta: "night.\n" },

    //           { type: "text-delta", id: msgId, delta: "A gentle " },
    //           { type: "text-delta", id: msgId, delta: "breeze begins " },
    //           { type: "text-delta", id: msgId, delta: "to sigh,\n" },

    //           { type: "text-delta", id: msgId, delta: "Whispering secrets " },
    //           { type: "text-delta", id: msgId, delta: "to the " },
    //           { type: "text-delta", id: msgId, delta: "sky.\n\n" },

    //           { type: "text-delta", id: msgId, delta: "Green blades " },
    //           { type: "text-delta", id: msgId, delta: "awaken, fresh " },
    //           { type: "text-delta", id: msgId, delta: "with dew,\n" },

    //           { type: "text-delta", id: msgId, delta: "Beneath a " },
    //           { type: "text-delta", id: msgId, delta: "heaven clear " },
    //           { type: "text-delta", id: msgId, delta: "and blue.\n" },

    //           { type: "text-delta", id: msgId, delta: "A distant " },
    //           { type: "text-delta", id: msgId, delta: "bird begins " },
    //           { type: "text-delta", id: msgId, delta: "its tune,\n" },

    //           { type: "text-delta", id: msgId, delta: "Singing softly " },
    //           { type: "text-delta", id: msgId, delta: "to the " },
    //           { type: "text-delta", id: msgId, delta: "moon's faint " },
    //           { type: "text-delta", id: msgId, delta: "rune.\n\n" },

    //           { type: "text-delta", id: msgId, delta: "The path " },
    //           { type: "text-delta", id: msgId, delta: "unwinds, a " },
    //           { type: "text-delta", id: msgId, delta: "dusty thread,\n" },

    //           { type: "text-delta", id: msgId, delta: "Where silent " },
    //           { type: "text-delta", id: msgId, delta: "thoughts are " },
    //           { type: "text-delta", id: msgId, delta: "gently led.\n" },

    //           { type: "text-delta", id: msgId, delta: "Each step " },
    //           { type: "text-delta", id: msgId, delta: "a moment, " },
    //           { type: "text-delta", id: msgId, delta: "soft and " },
    //           { type: "text-delta", id: msgId, delta: "slow,\n" },

    //           { type: "text-delta", id: msgId, delta: "Watching the " },
    //           { type: "text-delta", id: msgId, delta: "ancient river " },
    //           { type: "text-delta", id: msgId, delta: "flow.\n\n" },

    //           { type: "text-delta", id: msgId, delta: "Here, time " },
    //           { type: "text-delta", id: msgId, delta: "itself seems " },
    //           { type: "text-delta", id: msgId, delta: "to unbind,\n" },

    //           { type: "text-delta", id: msgId, delta: "Leaving the " },
    //           { type: "text-delta", id: msgId, delta: "hurried world " },
    //           { type: "text-delta", id: msgId, delta: "behind.\n" },

    //           { type: "text-delta", id: msgId, delta: "A peaceful " },
    //           { type: "text-delta", id: msgId, delta: "breath, a " },
    //           { type: "text-delta", id: msgId, delta: "tranquil gaze,\n" },

    //           { type: "text-delta", id: msgId, delta: "Lost in " },
    //           { type: "text-delta", id: msgId, delta: "the sun's " },
    //           { type: "text-delta", id: msgId, delta: "warm, golden " },
    //           { type: "text-delta", id: msgId, delta: "haze." },

    //           { type: "text-end", id: msgId },

    //           {
    //             type: "finish",
    //             finishReason: "stop",
    //             logprobs: undefined,
    //             usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    //           },
    //         ],
    //         chunkDelayInMs: 200,
    //         initialDelayInMs: 2000,
    //       }),
    //     }),
    //   }),
    //   prompt: "Hello, test!",
    // });

    const stream = result.toUIMessageStreamResponse<UIMessage>({
      originalMessages: validatedMessages,
      generateMessageId: () => msgId,
      messageMetadata: ({ part }) => {
        if (part.type === "start") {
          return {
            id: msgId,
            from: "ai",
            to: userId,
            conversationId,
            message: "generating",
            type: "generating",
            timestamp: messageTimestamp,
            deleted: false,
          };
        }

        if (part.type === "text-delta") {
          message += part.text;

          return {
            id: msgId,
            from: "ai",
            to: userId,
            conversationId,
            message,
            type: "message",
            timestamp: messageTimestamp,
            deleted: false,
          };
        }
      },
      async consumeSseStream({ stream }) {
        const streamId = generateId();

        // Create a resumable stream from the SSE stream
        const streamContext = createResumableStreamContext({
          waitUntil: waitUntilPolyfill,
          publisher,
          subscriber,
        });

        await streamContext.createNewResumableStream(streamId, () => stream);

        // Update the chat with the active stream ID
        await saveActiveStreamId({ conversationId, streamId });
      },
      onFinish: async ({ messages }) => {
        const lastMessage = messages.slice(-1).map((m) => m.metadata);
        produceMessage(
          createEnvelope("SAVE", { messages: lastMessage }),
          KAFKA_TOPICS.MESSAGES,
          conversationId
        );

        // Save the generated text with the stream ID
        const generatedText = lastMessage[0]?.message || "";
        await saveActiveStreamId({ conversationId, result: generatedText });
      },
      onError: (error: any) => {
        deleteActiveStream(id);
        console.log(error.message);
        return error;
      },
    });

    return stream;
  } catch (error) {
    console.error("Error sending event:", error);
    return NextResponse.json({ error: "Failed to start generation" }, { status: 500 });
  }
}
