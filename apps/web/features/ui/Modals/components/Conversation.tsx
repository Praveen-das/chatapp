import { RenderAvatar } from "@features/Dashboard/DashboardTabs/SharedComponents/Conversation/RenderAvatar";
import { CheckedIcon } from "@features/ui/CheckedIcon";
import { getDisplayName, getReceiver } from "@lib/conversation";
import { IConversation } from "@repo/interfaces/conversationInterface";

export function Conversation({
  conversation,
  isSelected = false,
}: {
  conversation: IConversation;
  isSelected: boolean;
}): React.JSX.Element {
  const displayName = getDisplayName(conversation)
  const receiver = getReceiver(conversation);

  return (
    <div className="max-sm:px-4 px-6 flex items-center hover:bg-[--hover-secondary] gap-4 w-full h-16 py-2 cursor-pointer">
      <RenderAvatar conversation={conversation} receiver={receiver} />
      <div className="h-full w-full flex justify-between items-center">
        <label className="text-sm pointer-events-none" htmlFor="">
          {displayName}
        </label>
      </div>
      {isSelected ? <CheckedIcon /> : <span />}
    </div>
  );
}
