import "dotenv/config";
import test from "node:test";
import assert from "node:assert";
import express, { Request, Response } from "express";
import sessionController from "../controller";
import sessionServices from "../services";
import { createAccessToken } from "@repo/utils";

/**
 * Helper: create a minimal Express app that mounts session routes
 * with no auth middleware (current production state).
 */
function createTestApp() {
  const app = express();
  app.use(express.json());

  app.get("/fetch", sessionController._getSession);

  return app;
}

// ─────────────────────────────────────────────────────────────────
// Test: GET /fetch returns 403 when no Authorization token is sent
// ─────────────────────────────────────────────────────────────────
test("GET /fetch returns 401/403 when no Authorization header is provided", async () => {
  const app = createTestApp();
  const server = app.listen(0);
  const port = (server.address() as any).port;

  const originalGetUserSessions = sessionServices.getUserSessions;
  let serviceWasCalled = false;
  sessionServices.getUserSessions = async () => {
    serviceWasCalled = true;
    return [] as any;
  };

  try {
    const res = await fetch(`http://localhost:${port}/fetch?userId=65c36b8e2197e411b0e00f5a`);

    // Should reject — currently it doesn't (this test should FAIL in RED phase)
    assert.ok(
      res.status === 401 || res.status === 403,
      `Expected 401 or 403 but got ${res.status}`
    );
    assert.strictEqual(serviceWasCalled, false, "getUserSessions should NOT have been called");
  } finally {
    sessionServices.getUserSessions = originalGetUserSessions;
    server.close();
  }
});

// ────────────────────────────────────────────────────────────────────────
// Test: GET /fetch returns 403 when token userId ≠ query userId
// ────────────────────────────────────────────────────────────────────────
test("GET /fetch returns 403 when authenticated user requests another user's sessions", async () => {
  const app = createTestApp();
  const server = app.listen(0);
  const port = (server.address() as any).port;

  const originalGetUserSessions = sessionServices.getUserSessions;
  let serviceWasCalled = false;
  sessionServices.getUserSessions = async () => {
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

    const res = await fetch(`http://localhost:${port}/fetch?userId=${victimUserId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.strictEqual(res.status, 403, "Should return 403 Forbidden");
    assert.strictEqual(serviceWasCalled, false, "getUserSessions should NOT have been called");
  } finally {
    sessionServices.getUserSessions = originalGetUserSessions;
    server.close();
  }
});

// ────────────────────────────────────────────────────────────────────
// Test: GET /fetch succeeds when token userId === query userId
// ────────────────────────────────────────────────────────────────────
test("GET /fetch succeeds when authenticated user requests their own sessions", async () => {
  const app = createTestApp();
  const server = app.listen(0);
  const port = (server.address() as any).port;

  const originalGetUserSessions = sessionServices.getUserSessions;
  sessionServices.getUserSessions = async () => {
    return [{ userId: "65c36b8e2197e411b0e00f5a", sessionId: "s1" }] as any;
  };

  try {
    const selfUserId = "65c36b8e2197e411b0e00f5a";

    const token = await createAccessToken({
      userId: selfUserId,
      sessionId: "sess1",
    });

    const res = await fetch(`http://localhost:${port}/fetch?userId=${selfUserId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.strictEqual(res.status, 200, "Should return 200 OK");
  } finally {
    sessionServices.getUserSessions = originalGetUserSessions;
    server.close();
  }
});
