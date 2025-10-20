import Menu from "@features/ui/Menu";
import useAuth from "@hooks/useAuth";
import { IConversation, IGroupConversation, IUserConversation } from "@repo/interfaces/conversationInterface";
import useSocket from "context/SocketProvider";
import { memo } from "react";
import { useConversationStore } from "store/conversationStore";
import { useStore } from "store/global";
import { useMessageStore } from "store/messageStore";
import { useAttachments } from "store/attachments";

function MenuContext() {
  const { user } = useAuth();
  const {
    sendUserBlockRequest,
    sendUserUnBlockRequest,
    sendRequestToArchiveConversation,
    sendRequestToUnarchiveConversation,
    sendGroupConversationDeleteRequest,
  } = useSocket();

  const setModal = useStore((s) => s.setModal);
  const clearImages = useAttachments((s) => s.clearImages);
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

  const handleBlockingUser = (userConversation: IUserConversation) => {
    if (userConversation.blocked) sendUserUnBlockRequest(userConversation);
    else {
      sendUserBlockRequest({ userConversation });
      clearImages();
    }
  };

  const handleExitingGroup = (conversation: IConversation) => {
    setModal({
      activeModal: "groupExitModal",
      state: conversation,
      open: true,
    });
    clearImages();
  };

  const handleDeletingGroup = ({ conversationId,id, channelId }: IGroupConversation) => {
    sendGroupConversationDeleteRequest({
      conversationId:id,
      groupId:conversationId,
      channelId:channelId!,
      userId: user?.id!,
    });
    clearImages();
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
              <Menu.Item onClick={() => handleExitingGroup(conversation)}>Exit group</Menu.Item>
            ) : (
              <Menu.Item onClick={() => handleDeletingGroup(conversation)}>Delete group</Menu.Item>
            )
          ) : (
            <>
              <Menu.Item onClick={() => handleDeletingConversation(conversation)}>Delete chat</Menu.Item>
              {conversation.host === "user" && (
                <Menu.Item onClick={() => handleBlockingUser(conversation)}>
                  {conversation.blocked ? "Unblock" : "Block"}
                </Menu.Item>
              )}
            </>
          )}
        </>
      )}
    </Menu>
  );
}

export default memo(MenuContext);
