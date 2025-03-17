import { useMemo } from "react";
import useSocket from "../../../context/SocketProvider";
import useAuth from "../../../hooks/useAuth";
import { useMessageStore } from "../../../store/messageStore";
import { useStore } from "../../../store/global";
import useSelectedConversation from "../../../hooks/useSelectedConversation";
import { IMessage } from "../../../interfaces/messageInterface";
import { IGroupConversation } from "../../../interfaces/conversationInterface";
import { IModal } from "@interfaces/modalInterface";
import { XCircleIcon } from "@heroicons/react/24/solid";
import { useConversationStore } from "store/conversationStore";

export const DeleteMessageModal = () => {
  const { user } = useAuth();
  const conversationId = useConversationStore((s) => s.selectedConversation)?.id!;
  const selectedConversation = useSelectedConversation(conversationId);

  const setSelectedChats = useMessageStore((s) => s.setSelectedChats);
  const setModal = useStore((s) => s.setModal);
  const { deleteMessageForAll, deleteMessagesForUser } = useSocket();

  if (!selectedConversation) return null;

  const modal = useStore<IModal<IMessage[]> | null>((s) => s.modal);
  const selectedChats = modal?.state || [];
  let authorizedUser = selectedConversation?.host === "group" && selectedConversation.admins.includes(user?.id!);

  const allowedDeleteForAll = useMemo(
    () =>
      selectedChats.some((msg) => {
        let isReceiver = msg.from !== user?.id;

        if (msg.deleted) return false;
        if (isReceiver && !authorizedUser) return false;

        return true;
      }),
    [selectedChats, user]
  );

  const handleMessageDelete = (deleteFor: { all?: true; userId?: string }) => {
    const conversationId = selectedConversation?.conversationId!;

    if (deleteFor["all"]) {
      let messages = selectedChats.map((message) => ({
        id: message.id,
        deleted: true,
      }));

      deleteMessageForAll({ conversation: selectedConversation!, messages });
    } else {
      const collection = selectedChats.map((message) => ({
        userId: user?.id!,
        messageId: message.id,
      }));

      deleteMessagesForUser({ conversationId, collection });
    }

    setSelectedChats(null);
    setModal(null);
  };

  return (
    <div className="modal-box flex flex-col justify-between p-8 h-44 gap-4 w-full max-w-xs bg-[--modal]">
      <div className="flex items-center justify-between">
        <label htmlFor="">Delete message ?</label>
        <form method="dialog">
          <button className="btn btn-circle btn-sm btn-ghost">
            <XCircleIcon className="size-6" />
          </button>
        </form>
      </div>
      <div className="flex w-full justify-stretch gap-4 mx-auto ">
        <div className="w-full">
          <button
            onClick={() => handleMessageDelete({ userId: user?.id })}
            className={`btn ${allowedDeleteForAll && "btn-outline btn-ghost btn-secondary"}  btn-sm w-full`}
          >
            Delete for me
          </button>
        </div>
        {allowedDeleteForAll && (
          <div className="w-full">
            <button onClick={() => handleMessageDelete({ all: true })} className="btn btn-sm btn-secondary w-full">
              Delete for all
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
