import "dotenv/config";
import test from "node:test";
import assert from "node:assert";
import express, { Request, Response, NextFunction } from "express";
import { verifyAuth } from "../middlewares/auth";
import { createAccessToken } from "@repo/utils";

/**
 * Helper: create a minimal Express app with verifyAuth middleware
 * and a test endpoint that exposes the attached identity fields.
 */
function createTestApp() {
  const app = express();
  app.use(express.json());

  app.use(verifyAuth);

  app.get("/protected", (req: Request, res: Response) => {
    res.json({
      authUserId: (req as any).authUserId ?? null,
      authSessionId: (req as any).authSessionId ?? null,
    });
  });

  return app;
}

// ────────────────────────────────────────────────────────
// Test 1: verifyAuth attaches authUserId from valid token
// ────────────────────────────────────────────────────────
test("verifyAuth attaches authUserId and authSessionId from a valid access token", async () => {
  const app = createTestApp();
  const server = app.listen(0);
  const port = (server.address() as any).port;

  try {
    const token = await createAccessToken({
      userId: "abc123",
      sessionId: "sess456",
    });

    const res = await fetch(`http://localhost:${port}/protected`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.strictEqual(data.authUserId, "abc123");
    assert.strictEqual(data.authSessionId, "sess456");
  } finally {
    server.close();
  }
});

// ────────────────────────────────────────────────────────
// Test 2: verifyAuth returns 401 when no token provided
// ────────────────────────────────────────────────────────
test("verifyAuth returns 401 when no Authorization header is provided", async () => {
  const app = createTestApp();
  const server = app.listen(0);
  const port = (server.address() as any).port;

  try {
    const res = await fetch(`http://localhost:${port}/protected`);
    assert.strictEqual(res.status, 401);
  } finally {
    server.close();
  }
});
