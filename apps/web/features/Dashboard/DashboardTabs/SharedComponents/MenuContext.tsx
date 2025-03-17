import Menu from "@features/ui/Menu";
import useAuth from "@hooks/useAuth";
import {
  IConversation,
  IUserConversation,
} from "@interfaces/conversationInterface";
import socket from "@lib/ws";
import useSocket from "context/SocketProvider";
import { memo } from "react";
import { useConversationStore } from "store/conversationStore";
import { useStore } from "store/global";
import { useMessageStore } from "store/messageStore";

function MenuContext() {
  const { user } = useAuth();
  const {
    sendUserBlockRequest,
    sendUserUnBlockRequest,
    sendRequestToArchiveConversation,
    sendRequestToUnarchiveConversation,
    deleteGroupConversation,
  } = useSocket();
  const setSelectedConversation = useConversationStore(
    (s) => s.setSelectedConversation
  );

  const setModal = useStore((s) => s.setModal);
  const selectedConversation = useConversationStore(
    (s) => s.selectedConversation
  );

  const handleArchiving = (conversation: IConversation) => {
    conversation.archived
      ? sendRequestToUnarchiveConversation(conversation)
      : sendRequestToArchiveConversation(conversation);
  };

  const handleDeletingConversation = (conversation: IConversation) => {
    setModal({
      activeModal: "deleteConversationModal",
      state: conversation,
      open: true,
    });
  };

  const handleBlockingUser = (conversation: IUserConversation) => {
    if (conversation.blocked) sendUserUnBlockRequest(conversation);
    else sendUserBlockRequest(conversation);
  };

  const handleExitingGroup = (conversation: IConversation) => {
    setModal({
      activeModal: "groupExitModal",
      state: conversation,
      open: true,
    });
  };

  const handleDeletingGroup = (conversation: IConversation) => {
    deleteGroupConversation(conversation);
  };

  return (
    <Menu<IConversation> id="conversation" placement="bottom-end">
      {(conversation) => (
        <>
          <Menu.Item onClick={() => handleArchiving(conversation)}>
            {conversation.archived ? "Unarchive chat" : "Archive chat"}
          </Menu.Item>
          {conversation.host === "group" ? (
            conversation.members.some((m) => m.id === user?.id) ? (
              <Menu.Item onClick={() => handleExitingGroup(conversation)}>
                Exit group
              </Menu.Item>
            ) : (
              <Menu.Item onClick={() => handleDeletingGroup(conversation)}>
                Delete group
              </Menu.Item>
            )
          ) : (
            <>
              <Menu.Item
                onClick={() => handleDeletingConversation(conversation)}
              >
                Delete chat
              </Menu.Item>
              <Menu.Item onClick={() => handleBlockingUser(conversation)}>
                {conversation.blocked ? "Unblock" : "Block"}
              </Menu.Item>
            </>
          )}
        </>
      )}
    </Menu>
  );
}

export default memo(MenuContext);
