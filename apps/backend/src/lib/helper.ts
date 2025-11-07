import { Types } from "mongoose";

export function toString(value: string | Types.ObjectId) {
  return typeof value === "object" ? value.toHexString() : value;
}