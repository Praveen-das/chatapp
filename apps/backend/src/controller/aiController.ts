import { Request, Response } from "express";
import { aiQueue } from "../lib/queue";

export const assistWithText = async (req: Request, res: Response) => {
  try {
    const { text, context, enableContext = true, socketId, isDuplicate = false } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    if (!socketId) {
      return res.status(400).json({ error: "Socket ID is required" });
    }

    // Add job to queue
    const job = await aiQueue.add("process-ai-text", {
      text,
      context,
      enableContext,
      userId: (req as any).user?.id,
      socketId,
      isDuplicate,
    });

    res.json({ status: "queued", jobId: job.id });
  } catch (error) {
    console.error("Error queuing AI job:", error);
    res.status(500).json({ error: "Failed to queue request" });
  }
};
