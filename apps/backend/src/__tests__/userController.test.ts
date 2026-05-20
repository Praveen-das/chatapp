import "dotenv/config";
import test from "node:test";
import assert from "node:assert";
import express, { Request, Response } from "express";
import { createAccessToken } from "@repo/utils";
import userController from "../controller/userController";
import userServices from "../services/userServices";
import { Types } from "mongoose";

/**
 * Helper: create an Express app with a simulated verifyAuth that
 * attaches authUserId / authSessionId, then mounts the user routes.
 */
function createTestApp() {
  const app = express();
  app.use(express.json());

  // Simulated auth middleware that attaches identity from Authorization header's token
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

  app.delete("/user/:id", userController._deleteUser);

  return app;
}

// ─────────────────────────────────────────────────────
// Test: DELETE /user/:id rejects when caller ≠ target
// ─────────────────────────────────────────────────────
test("DELETE /user/:id returns 403 when authenticated user tries to delete a different user", async () => {
  const app = createTestApp();
  const server = app.listen(0);
  const port = (server.address() as any).port;

  // Preserve and stub
  const originalDelete = userServices.deleteUser;
  let deleteWasCalled = false;
  userServices.deleteUser = async () => {
    deleteWasCalled = true;
    return null as any;
  };

  try {
    const callerUserId = "65c36b8e2197e411b0e00f5a";
    const victimUserId = "65c36b8e2197e411b0e00f5b"; // different user

    const token = await createAccessToken({
      userId: callerUserId,
      sessionId: "sess1",
    });

    const res = await fetch(`http://localhost:${port}/user/${victimUserId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.strictEqual(res.status, 403, "Should return 403 Forbidden");
    assert.strictEqual(deleteWasCalled, false, "deleteUser service should NOT have been called");
  } finally {
    userServices.deleteUser = originalDelete;
    server.close();
  }
});

// ──────────────────────────────────────────────────────────
// Test: DELETE /user/:id succeeds when caller === target
// ──────────────────────────────────────────────────────────
test("DELETE /user/:id succeeds when authenticated user deletes their own account", async () => {
  const app = createTestApp();
  const server = app.listen(0);
  const port = (server.address() as any).port;

  const originalDelete = userServices.deleteUser;
  let deleteWasCalled = false;
  userServices.deleteUser = async () => {
    deleteWasCalled = true;
    return { id: "self" } as any;
  };

  try {
    const selfUserId = "65c36b8e2197e411b0e00f5a";

    const token = await createAccessToken({
      userId: selfUserId,
      sessionId: "sess1",
    });

    const res = await fetch(`http://localhost:${port}/user/${selfUserId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    assert.strictEqual(res.status, 200, "Should return 200 OK");
    assert.strictEqual(deleteWasCalled, true, "deleteUser service should have been called");
  } finally {
    userServices.deleteUser = originalDelete;
    server.close();
  }
});
