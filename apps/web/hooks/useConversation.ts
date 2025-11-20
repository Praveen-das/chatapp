import { findUserConversation } from "@lib/conversation";
import { IUser } from "@repo/interfaces/userInterface";
import useSocket from "context/SocketProvider";
import { getSession } from "next-auth/react";
import { useCallback } from "react";
import { useConversationStore } from "store/conversationStore";

const { setSelectedConversation } = useConversationStore.getState().conversationActions;

const useConversation = () => {
  const { sendRequestToRegisterConversation } = useSocket();

  const startConversation = useCallback(async (participant: IUser) => {
    if (!participant) return;

    const conversation = findUserConversation(participant.id);

    if (conversation) setSelectedConversation(conversation.id);
    else {
      const { user } = (await getSession())!;
      if (!user) return;
      sendRequestToRegisterConversation({ currentUser: user, participant });
    }
  }, []);

  // const startSystemConversation = useCallback(async (user: IUser) => {
  //   if (!user) return;

  //   const { user: sender } = (await getSession())!;
  //   const { conversation, userConversations } = handleGeneratingConversation(user!, sender!);

  //   sendRequestToRegisterConversation(conversation);
  //   sendRequestToRegisterUserConversation(userConversations);
  // }, []);

  return {
    startConversation,
  };
};

export default useConversation;
