import { deleteActiveStream, getActiveStream, saveActiveStreamId } from "@lib/stream-store";
import { UI_MESSAGE_STREAM_HEADERS } from "ai";
import { createResumableStreamContext } from "resumable-stream/ioredis";
import { publisher, subscriber } from "../../../../../redis/client";

// Polyfill for Next.js 14 compatibility (Next.js 15+ has native 'after' function)
// This simply executes the promise without deferring it
const waitUntilPolyfill = (promise: Promise<unknown>) => {
  promise.catch((error) => {
    console.error("Background task error:", error);
  });
};

const streamContext = createResumableStreamContext({
  waitUntil: waitUntilPolyfill,
  publisher,
  subscriber,
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // Get the active stream data for this conversation
  const activeStreamData = await getActiveStream(id);

  if (!activeStreamData || !activeStreamData.streamId) {
    console.log("No active stream found for conversation", id);
    // No content response when there is no active stream
    return new Response(null, { status: 204 });
  }

  const { streamId, result } = activeStreamData;

  // Check if the stream exists in Redis
  const streamExists = await streamContext.hasExistingStream(streamId);

  // If stream is done (doesn't exist in Redis) and we have saved text
  if (streamExists === "DONE" && result) {
    console.log("Stream completed, returning saved text for conversation", id);

    // Create a new stream with the saved text
    const textStream = new ReadableStream<string>({
      start(controller) {
        controller.enqueue(result);
        controller.close();
      },
    });

    const [stream] = await Promise.all([
      streamContext.createNewResumableStream(streamId, () => textStream),
      deleteActiveStream(id),
    ]);

    return new Response(stream, {
      headers: UI_MESSAGE_STREAM_HEADERS,
    });
  }

  // If stream still exists, resume it
  if (streamExists) {
    console.log("Resuming existing stream for conversation", id);
    const stream = await streamContext.resumeExistingStream(streamId);

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    (async () => {
      let completed = false;
      try {
        if (!stream) return;

        const reader = stream.getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            completed = true;
            break;
          }
          await writer.write(value);
        }
      } finally {
        if (completed) {
          deleteActiveStream(id);
        }
        await writer.close();
      }
    })();

    return new Response(readable, { headers: UI_MESSAGE_STREAM_HEADERS });
  }

  // Fallback: active stream ID exists in our store, but stream is gone from Redis and no text saved.
  await deleteActiveStream(id);
  return new Response(null, { status: 204 });
}
