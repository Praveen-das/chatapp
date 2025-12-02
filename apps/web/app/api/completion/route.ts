import { inngest } from "@lib/inngest/client";
import { NextRequest, NextResponse } from "next/server";
import { subscribe } from "@inngest/realtime";

// Opt out of caching; every request should send a new event
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const uuid = crypto.randomUUID();

    await inngest.send({
      name: "chatapp-generate-content",
      data: { uuid, ...body },
    });

    const stream = new ReadableStream({
      async start(controller) {
        await subscribe({ app: inngest, channel: "chat/generate.content:" + uuid, topics: ["stream"] }, (chunk) => {
          controller.enqueue(`data: ${JSON.stringify(chunk.data)}\n\n`);
          if (chunk.data.type === "finish") controller.close();
        });
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
      },
    });

    return Response.json({ message: "Hello, world!" });
  } catch (error) {
    console.error("Error sending Inngest event:", error);
    return NextResponse.json({ error: "Failed to start generation" }, { status: 500 });
  }
}
