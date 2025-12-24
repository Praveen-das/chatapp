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
import produceMessage from "../../../../socket-service/src/kafka/kafka";
import { systemInstruction } from "./s_prompt";
import { publisher, subscriber } from "../../../redis/client";

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

    await produceMessage({ messages: [validatedMessages.at(-1)?.metadata] }, "MESSAGES");

    const result = streamText({
      model: google("gemini-2.5-flash"),
      system: systemInstruction,
      messages: convertToModelMessages(validatedMessages),
      experimental_transform: smoothStream({
        delayInMs: 100, // optional: defaults to 10ms
        chunking: "line", // optional: defaults to 'word'
      }),
    });

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
        produceMessage({ messages: lastMessage }, "MESSAGES");

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
