import { IUserConversation, IGroupConversation, IConversation } from "../../../../interfaces/conversationInterface";

export function Conversation({
  conversation,
  isSelected = false,
}: {
  conversation: IConversation;
  isSelected: boolean;
}): React.JSX.Element {
  const displayName = conversation.displayName;

  return (
    <div className="px-6 flex items-center hover:bg-black hover:bg-opacity-30 gap-4 w-full h-16 py-2 cursor-pointer">
      <div className="h-full aspect-square rounded-full bg-base-100"></div>
      <div className="h-full w-full flex justify-between items-center">
        <label className="text-sm pointer-events-none" htmlFor="">
          {displayName}
        </label>
      </div>
      {isSelected ? (
        <svg
          className="w-6 h-6 "
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            fillRule="evenodd"
            d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12Zm13.36-1.814a.75.75 0 1 0-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 0 0-1.06 1.06l2.25 2.25a.75.75 0 0 0 1.14-.094l3.75-5.25Z"
            clipRule="evenodd"
          />
        </svg>
      ) : (
        <span />
      )}
    </div>
  );
}
