// Bull Board Dashboard Setup
import express from "express";
import { ExpressAdapter } from "@bull-board/express";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { createBullBoard } from "@bull-board/api";
import { aiQueue } from "../lib/queue";

export function setupBullBoard(app: express.Express) {
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath("/admin/queues");

  createBullBoard({
    queues: [new BullMQAdapter(aiQueue)],
    serverAdapter,
  });

  app.use("/admin/queues", serverAdapter.getRouter());

  console.log("Bull Board dashboard available at: http://localhost:4000/admin/queues");
}
