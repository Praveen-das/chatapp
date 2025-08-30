import { IMessage as _IMessage } from "@repo/interfaces/messageInterface";
import { Override } from "@repo/interfaces/type";
import { z } from "zod";
import { userMessageSchema } from "../schemas/userMessageSchema";

export type IMessage = Override<_IMessage, z.infer<typeof userMessageSchema>>;
