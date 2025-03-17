import useSelectedConversation from "@hooks/useSelectedConversation";
import { useStore } from "../../../../store/global";

function StarredMessages({ conversationId }: { conversationId: string }) {
  const profileTab = useStore((s) => s.profileTab);
  const conversation = useSelectedConversation(conversationId);

  if (!conversation) return;

  const total = conversation?.starred?.length || 0;

  return (
    <div
      onClick={() => !!total && profileTab.push("starred_messages")}
      className={`capitalize w-full flex items-center justify-between gap-4 ${!!total ? "cursor-pointer" : ""}`}
    >
      Starred Messages
      <span>{total}</span>
    </div>
  );
}

export default StarredMessages;
