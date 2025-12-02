import { Queue } from "bullmq";
import { connection } from "../redis/client";

export const aiQueue = new Queue("ai-assist", { connection });
