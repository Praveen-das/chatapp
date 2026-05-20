import "dotenv/config";
import test from "node:test";
import assert from "node:assert";
import express, { Request, Response } from "express";
import { createAccessToken } from "@repo/utils";
import messageController from "../controller/messageController";
import messageServices from "../services/messageServices";

/**
 * Helper: create an Express app with simulated auth middleware
 * and the getUserMessages route mounted.
 */
function createTestApp() {
  const app = express();
  app.use(express.json());

  // Simulated auth middleware
  app.use(async (req: Request, res: Response, next) => {
    try {
      const token = req.headers.authorization?.split(" ")[1];
      if (!token) return res.sendStatus(401);

      const { jwtVerify } = await import("jose");
      const secret = new TextEncoder().encode(process.env.JWT_ACCESS_TOKEN_SECRET_KEY);
      const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });

      (req as any).authUserId = payload.userId;
      (req as any).authSessionId = payload.sessionId;
      next();
    } catch {
      return res.sendStatus(401);
    }
  });

  app.get("/messages/fetch", messageController._getUserMessages);

  return app;
}

// ────────────────────────────────────────────────────────────────
// Test: GET /messages/fetch returns 403 when userId ≠ token user
// ────────────────────────────────────────────────────────────────
test("GET /messages/fetch returns 403 when authenticated user requests another user's messages", async () => {
  const app = createTestApp();
  const server = app.listen(0);
  const port = (server.address() as any).port;

  const originalGetUserMessages = messageServices.getUserMessages;
  let serviceWasCalled = false;
  messageServices.getUserMessages = async () => {
    serviceWasCalled = true;
    return [] as any;
  };

  try {
    const callerUserId = "65c36b8e2197e411b0e00f5a";
    const victimUserId = "65c36b8e2197e411b0e00f5b";

    const token = await createAccessToken({
      userId: callerUserId,
      sessionId: "sess1",
    });

    const params = new URLSearchParams({
      cid: "65c36b8e2197e411b0e00f5c",
      userId: victimUserId,
      c: "0",
      host: "user",
      limit: "20",
      deletedAt: "0",
    });

    const res = await fetch(`http://localhost:${port}/messages/fetch?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.strictEqual(res.status, 403, "Should return 403 Forbidden");
    assert.strictEqual(serviceWasCalled, false, "getUserMessages service should NOT have been called");
  } finally {
    messageServices.getUserMessages = originalGetUserMessages;
    server.close();
  }
});

// ────────────────────────────────────────────────────────────
// Test: GET /messages/fetch succeeds when userId === token user
// ────────────────────────────────────────────────────────────
test("GET /messages/fetch succeeds when authenticated user requests their own messages", async () => {
  const app = createTestApp();
  const server = app.listen(0);
  const port = (server.address() as any).port;

  const originalGetUserMessages = messageServices.getUserMessages;
  messageServices.getUserMessages = async () => {
    return [{ id: "msg1" }] as any;
  };

  try {
    const selfUserId = "65c36b8e2197e411b0e00f5a";

    const token = await createAccessToken({
      userId: selfUserId,
      sessionId: "sess1",
    });

    const params = new URLSearchParams({
      cid: "65c36b8e2197e411b0e00f5c",
      userId: selfUserId,
      c: "0",
      host: "user",
      limit: "20",
      deletedAt: "0",
    });

    const res = await fetch(`http://localhost:${port}/messages/fetch?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.strictEqual(res.status, 200, "Should return 200 OK");
  } finally {
    messageServices.getUserMessages = originalGetUserMessages;
    server.close();
  }
});
