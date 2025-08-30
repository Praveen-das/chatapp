import { Override } from "@repo/interfaces/type";
import { IUser as _IUser } from "@repo/interfaces/userInterface";
import { Types } from "mongoose";

export type IUser = Override<_IUser, { id: Types.ObjectId }>;
