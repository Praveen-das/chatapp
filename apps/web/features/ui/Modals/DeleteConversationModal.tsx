import useSocket from "../../../context/SocketProvider";
import { useMessageStore } from "../../../store/messageStore";
import { useStore } from "../../../store/global";
import { IModal } from "@interfaces/modalInterface";
import { IConversation } from "@interfaces/conversationInterface";
import { useConversationStore } from "store/conversationStore";
import socket from "@lib/ws";

export const DeleteConversationModal = () => {
  const updateConversation = useConversationStore((s) => s.updateConversation);
  const clearChat = useMessageStore((s) => s.clearChat);
  const toggleProfile = useStore((s) => s.toggleProfile);
  const modal = useStore<IModal<IConversation> | null>((s) => s.modal);
  const setModal = useStore((s) => s.setModal);
  const { sendConversationDeleteRequest } = useSocket();
  const setSelectedConversation = useConversationStore(
    (s) => s.setSelectedConversation
  );
  const conversation = modal?.state;

  function handleDeletingConversation() {
    if (!conversation) return setModal(null);

    const selectedConversation =
      useConversationStore.getState().selectedConversation;
    let conversationId = conversation?.id!;

    sendConversationDeleteRequest(conversationId);
    updateConversation(conversationId, { active: false, archived: false });
    clearChat(conversation.conversationId);
    toggleProfile(false);

    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
      socket.selectedConversation = null;
    }
    setModal(null);
  }

  return (
    <div className="modal-box flex flex-col justify-between p-8 h-44 gap-4 w-full max-w-xs bg-[--modal]">
      <div className="flex items-center justify-between">
        <label htmlFor="">Delete this conversation ?</label>
      </div>
      <div className="flex w-full justify-stretch gap-4 mx-auto ">
        <div className="w-full">
          <button
            onClick={() => setModal(null)}
            className={`btn btn-outline btn-ghost btn-secondary  btn-sm w-full`}
          >
            Cancel
          </button>
        </div>
        <div className="w-full">
          <button
            onClick={handleDeletingConversation}
            className="btn btn-sm btn-secondary w-full"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};
