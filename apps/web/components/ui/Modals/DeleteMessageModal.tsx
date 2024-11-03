import { useMemo } from "react";
import useSocket from "../../../context/SocketProvider";
import useAuth from "../../../hooks/useAuth";
import { useMessageStore } from "../../../store/messageStore";
import { useStore } from "../../../store/global";
import useSelectedConversation from "../../../hooks/useSelectedConversation";
import { IMessage } from "../../../interfaces/messageInterface";
import { IGroupConversation } from "../../../interfaces/conversationInterface";
import { IModal } from "@interfaces/modalInterface";

const closeModal = () => {
  (document?.getElementById("action-modal") as HTMLDialogElement)?.close();
};

export const DeleteMessageModal = () => {
  const setSelectedChats = useMessageStore((s) => s.setSelectedChats);
  const setModal = useStore((s) => s.setModal);
  const { deleteMessageForAll, deleteMessagesForUser } = useSocket();

  const { user } = useAuth();
  const selectedConversation = useSelectedConversation();
  const modal = useStore<IModal<IMessage[]> | null>((s) => s.modal);
  const selectedChats = modal?.state || [];
  let authorizedUser =
    selectedConversation?.host === "group" &&
    selectedConversation.members.find((m) => m.id === user?.id)?.isAdmin;

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
    const conversationId = selectedConversation?.id!;

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

    // let req = { conversationId, to, messages };

    // deleteMessageForAll(req);
    setSelectedChats(null);
    setModal(null);
    closeModal();
  };

  return (
    <div className="modal-box flex flex-col justify-between p-8 h-44 gap-4 w-full max-w-xs bg-[--modal]">
      <div className="flex items-center justify-between">
        <label htmlFor="">Delete message ?</label>
        <form method="dialog">
          <button className="btn btn-circle btn-sm btn-ghost">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
                clipRule="evenodd"
              />
            </svg>
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
            <button
              onClick={() => handleMessageDelete({ all: true })}
              className="btn btn-sm btn-secondary w-full"
            >
              Delete for all
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
