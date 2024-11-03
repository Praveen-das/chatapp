import useAuth from "@hooks/useAuth";
import {
  IConversation,
  IConversationBase,
} from "@interfaces/conversationInterface";
import { IBlocked } from "@interfaces/userInterface";
import socket from "@lib/ws";
import ObjectID from "bson-objectid";
import useSocket from "context/SocketProvider";
import React, { useMemo } from "react";
import { useConversationStore } from "store/conversationStore";
import { useStore } from "store/global";
import { useMessageStore } from "store/messageStore";

function useMenuOptions({
  conversation,
  isSelected,
}: {
  conversation: IConversation;
  isSelected: boolean;
}) {
  const { user } = useAuth();
  const {
    blockedUsers,
    sendUserBlockRequest,
    sendUserUnBlockRequest,
    sendConversationDeleteRequest,
    sendRequestToArchiveConversation,
    sendRequestToUnarchiveConversation,
  } = useSocket();
  const setSelectedConversation = useConversationStore(
    (s) => s.setSelectedConversation
  );
  const deleteConversation = useConversationStore((s) => s.deleteConversation);
  const clearChat = useMessageStore((s) => s.clearChat);
  const toggleProfile = useStore((s) => s.toggleProfile);

  const member = conversation.members.find((member) => member.id !== user?.id);

  const handleArchiving = () => {
    conversation.isArchived
      ? sendRequestToUnarchiveConversation(conversation?.id!)
      : sendRequestToArchiveConversation(conversation?.id!);

    if (isSelected) setSelectedConversation(null);
  };

  const handleDeletingConversation = () => {
    const selectedConversation =
      useConversationStore.getState().selectedConversation;
    let conversationId = conversation?.id!;

    let req = {
      conversation,
      userId: user?.id!,
      deletedForUser: true,
      timeOfDeletion: Date.now(),
    };

    sendConversationDeleteRequest(req);
    deleteConversation(conversationId, user?.id!);
    clearChat(conversationId);
    toggleProfile(false);

    if (selectedConversation?.id === conversationId) {
      setSelectedConversation(null);
      socket.selectedConversation = null;
    }
  };

  const handleBlockingUser = () => {
    const receiver = conversation.members.find(
      (connectedUser) => connectedUser.id === member?.id
    )!;

    const blockedUser = blockedUsers.find(
      (u) => u.blockedUser.id === receiver.id
    )!;
    

    const req = {
      id: new ObjectID().toHexString(),
      user: user!,
      blockedUser: receiver!,
    };

    if (blockedUser) sendUserUnBlockRequest(blockedUser);
    else sendUserBlockRequest(req);
  };

  return {
    handleArchiving,
    handleDeletingConversation,
    handleBlockingUser
  };
}

export default useMenuOptions;
