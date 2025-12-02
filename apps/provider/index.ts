import { aiQueue } from "./lib/queue";

export const sendToQueue = async (count: number) => {
  try {
    const job = await aiQueue.add("process-ai-text", { count });
    console.log("Job added to queue:", job.id);
  } catch (error) {
    console.error("Error queuing job:", error);
  }
};
//aa
function init() {
  for (let i = 0; i < 11; i++) {
    sendToQueue(i);
  }
}

init();
