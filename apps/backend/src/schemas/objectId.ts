import { Types } from "mongoose";
import { z } from "zod";

export const objectId = z
  .string()
  .refine((val) => Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId",
  })
  .transform((val) => new Types.ObjectId(val));
