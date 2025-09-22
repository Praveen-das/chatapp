import { z } from "zod";
import { objectId } from "./objectId";
import Dot from "dot-object";

Dot.keepArray = true

const rule = z.object({ isVisible: z.boolean() });

export const userRules = z
  .object({
    profilePicture: rule,
    bio: rule,
    lastSeen: rule,
    readReceipts: rule,
  })
  .partial();

export const userSchema = z.object({
  id: z.string(),
  username: z.string().min(3).max(20),
  phoneNumber: z.string(),
  profilePicture: z.string(),
  bio: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export const updateUserSchema = z.object({
  id: objectId,
  updates: userSchema
    .extend({
      rules: userRules.optional(),
      status: z.enum(["offline", "online"]),
      lastSeen: z.number(),
    })
    .partial()
    .transform((input) => Dot.dot(input)),
});
