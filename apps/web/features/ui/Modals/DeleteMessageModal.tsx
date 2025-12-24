import { useMemo, useState } from "react";
import useSocket from "../../../context/SocketProvider";
import useAuth from "../../../hooks/useAuth";
import { useMessageStore } from "../../../store/messageStore";
import { useStore } from "../../../store/global";
import useSelectedConversation from "../../../hooks/useSelectedConversation";
import { IMessage } from "@repo/interfaces/messageInterface";
import { XCircleIcon } from "@heroicons/react/24/solid";
import { useConversationStore } from "store/conversationStore";
import { IModal } from "@interfaces/modalInterface";
import FramerWrapper from "../MotionWrapper";

export const DeleteMessageModal = () => {
  const { user } = useAuth();
  const selectedConversation = useSelectedConversation();

  if (!selectedConversation) return null;

  const setSelectedChats = useMessageStore((s) => s.setSelectedChats);
  const setModal = useStore((s) => s.setModal);
  const { deleteMessageForAll, deleteMessagesForUser } = useSocket();
  const [deleteForAll, setDeleteForAll] = useState<boolean | null>(null);

  const modal = useStore<IModal<IMessage[]> | null>((s) => s.modal);
  const selectedChats = modal?.state || [];
  let authorizedUser = selectedConversation?.host === "group" && selectedConversation.admins.includes(user?.id!);

  const allowedDeleteForAll = useMemo(
    () =>
      selectedChats.some((msg) => {
        let isReceiver = msg.from !== user?.id;
        let toAi = msg.to === "ai";

        if (msg.deleted) return false;
        if (toAi) return false;
        if (isReceiver && !authorizedUser) return false;

        return true;
      }),
    [selectedChats, user, authorizedUser]
  );

  const handleMessageDelete = () => {
    if (deleteForAll) {
      let messages = selectedChats.map((message) => ({
        id: message.id,
        deleted: true,
      }));

      deleteMessageForAll({ conversation: selectedConversation!, messages });
    } else {
      const conversationId = selectedConversation?.conversationId!;
      const collection = selectedChats.map((message) => ({
        userId: user?.id!,
        messageId: message.id,
      }));

      deleteMessagesForUser({ conversationId, collection });
    }

    setSelectedChats(null);
    setModal(false);
  };

  return (
    <FramerWrapper className="modal-box w-full max-w-xs p-0 bg-transparent">
      <div className="flex flex-col justify-between p-8 gap-8 w-full bg-[--modal]">
        <div className="flex items-center justify-between">
          <label className="text-lg" htmlFor="Delete message">
            Delete message ?
          </label>
        </div>

        {allowedDeleteForAll && (
          <div className="space-y-1">
            <div className="form-control">
              <label className="label gap-4 justify-start cursor-pointer">
                <input
                  onInput={() => setDeleteForAll(false)}
                  type="radio"
                  name="radio-10"
                  className="radio radio-sm checked:bg-primary"
                />
                <span className="label-text">Delete for me</span>
              </label>
            </div>
            <div className="form-control">
              <label className="label gap-4 justify-start cursor-pointer">
                <input
                  onInput={() => setDeleteForAll(true)}
                  type="radio"
                  name="radio-10"
                  className="radio radio-sm checked:bg-primary"
                />
                <span className="label-text">Delete for everyone</span>
              </label>
            </div>
          </div>
        )}

        <div className="flex w-full justify-stretch gap-4 mx-auto mt-4">
          <div className="w-full">
            <button
              disabled={deleteForAll === null && allowedDeleteForAll}
              onClick={handleMessageDelete}
              className={`btn btn-sm btn-error btn-block`}
            >
              Delete
            </button>
          </div>
          <div className="w-full">
            <form method="dialog">
              <button className="btn btn-sm [--b2:--b1] btn-block">Cancel</button>
            </form>
          </div>
        </div>
      </div>
    </FramerWrapper>
  );
};
