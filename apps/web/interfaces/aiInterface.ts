import { UIMessage as _UIMessage } from "ai";
import { IMessage } from "./messageInterface";

export type UIMessage = _UIMessage<
  IMessage,
  {
    init: IMessage;
  }
>;
