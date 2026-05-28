import { z } from "zod";

export const saveSessionSchema = z.object({
  body: z.object({
    userId: z.string().min(1, "userId is required"),
    sessionId: z.string().min(1, "sessionId is required"),
    data: z.object({
      browser: z.string(),
      os: z.string(),
      device: z.string(),
      city: z.string(),
      timestamp: z.number(),
    }),
    self: z.boolean().optional(),
    expired: z.boolean().optional(),
  }),
});

export const updateSessionSchema = z.object({
  body: z.object({
    userId: z.string().min(1, "userId is required"),
    sessionId: z.string().min(1, "sessionId is required"),
    data: z.any().optional(),
    self: z.boolean().optional(),
    expired: z.boolean().optional(),
  }),
});

export const deleteSessionSchema = z.object({
  params: z.object({
    id: z.string().min(1, "id is required"),
  }),
});

export const clearSessionsSchema = z.object({
  body: z.object({
    userId: z.string().min(1, "userId is required"),
    sessionIds: z.array(z.string()).min(1, "sessionIds must contain at least one ID"),
  }),
});

export const getSessionSchema = z.object({
  query: z.object({
    userId: z.string().optional(),
    sessionId: z.string().optional(),
  }),
});

export const refreshTokenSchema = z.object({
  query: z.any().optional(),
});
