import { useCallback, useMemo } from "react";
import { useStore } from "../store/global";
import { IUser } from "@interfaces/userInterface";
import { findUserConversation, handleGeneratingConversation } from "@lib/conversation";
import { useConversationStore } from "store/conversationStore";
import useAuth from "./useAuth";
import useSocket from "context/SocketProvider";
import socket from "@lib/ws";
import { IUserConversation } from "@interfaces/conversationInterface";

const { setSelectedConversation,setConversation } = useConversationStore.getState();

const useConversation = () => {
  const { sendRequestToRegisterConversation, sendRequestToRegisterUserConversation } = useSocket();
  const conversations = useConversationStore((s) => s.conversations);
  const sc = useConversationStore((s) => s.selectedConversation);
  const su = useStore((s) => s.selectedUser);

  const conversation = useMemo(
    () =>
      conversations.find((c) =>
        su ? c.host === "user" && c.members.some((m) => m.id === su.id) : c.conversationId === sc?.conversationId
      ),
    [conversations, sc, su]
  );

  const startConversation = useCallback((user: IUser) =>{
    if (!user) return;

    const conversation = findUserConversation(user.id);

    if (conversation) setSelectedConversation(conversation.id);
    else {
      const currentUser = useAuth.getState().user;
      const { conversation: newConversation, userConversations } = handleGeneratingConversation(currentUser!, user!);

      sendRequestToRegisterConversation(newConversation);
      sendRequestToRegisterUserConversation(userConversations);

      userConversations.forEach((c) => {
        if (c.userId === currentUser?.id) {
          setConversation(c);
          socket.selectedConversation = c;
          setSelectedConversation(c.id);
        }
      });
    }
  },[])

  return {
    startConversation,
    conversation,
  }
};

export default useConversation;
