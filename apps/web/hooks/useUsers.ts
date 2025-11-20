import { useShallow } from "zustand/react/shallow";
import { useConversationStore } from "store/conversationStore";
import { IUser } from "@repo/interfaces/userInterface";
import { activeUserReducerHelper, getReceiver } from "@lib/conversation";

export function useUsers() {
  return useConversationStore(useShallow((s) => s.conversations.reduce<IUser[]>(activeUserReducerHelper, [])));
}

export function useUnblockedUsers() {
  return useConversationStore(
    useShallow((s) =>
      s.conversations.reduce<IUser[]>((i, c) => {
        const user = getReceiver(c);
        if (user && c.host === "user" && !c.blocked) {
          i.push(user);
        }
        return i;
      }, [])
    )
  );
}
