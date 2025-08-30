import useSocket from "../../../context/SocketProvider";
import { useMessageStore } from "../../../store/messageStore";
import { useStore } from "../../../store/global";
import { IConversation } from "@repo/interfaces/conversationInterface";
import { useConversationStore } from "store/conversationStore";
import socket from "@lib/ws";
import { IModal } from "@interfaces/modalInterface";
import FramerWrapper from "../MotionWrapper";

export const DeleteConversationModal = () => {
  const { updateConversation, setSelectedConversation } = useConversationStore((s) => s.conversationActions);
  const clearChat = useMessageStore((s) => s.clearChat);
  const toggleProfile = useStore((s) => s.toggleProfile);
  const modal = useStore<IModal<IConversation> | null>((s) => s.modal);
  const setModal = useStore((s) => s.setModal);
  const { sendConversationDeleteRequest } = useSocket();
  const conversation = modal?.state;

  function handleDeletingConversation() {
    if (!conversation) return setModal(false);

    const selectedConversation = useConversationStore.getState().selectedConversation;
    let conversationId = conversation?.id!;

    sendConversationDeleteRequest(conversationId);
    updateConversation(conversationId, { active: false, archived: false });
    clearChat(conversation.conversationId);
    toggleProfile(false);

    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
      socket.selectedConversation = null;
    }
    setModal(false);
  }

  return (
    <FramerWrapper className={`modal-box flex flex-col justify-between p-8 h-44 gap-4 w-full max-w-xs bg-[--modal]`}>
      <div className="flex items-center justify-between">
        <label htmlFor="">Delete this conversation ?</label>
      </div>
      <div className="flex w-full justify-stretch gap-4 mx-auto ">
        <div className="w-full">
          <button onClick={() => setModal(false)} className={`btn btn-sm [--b2:--b1] btn-block`}>
            Cancel
          </button>
        </div>
        <div className="w-full">
          <button onClick={handleDeletingConversation} className="btn btn-sm btn-error btn-block">
            Delete
          </button>
        </div>
      </div>
    </FramerWrapper>
  );
};
