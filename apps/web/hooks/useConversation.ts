import { useCallback, useMemo } from "react";
import { useStore } from "../store/global";
import { IUser } from "@repo/interfaces/userInterface";
import { findUserConversation } from "@lib/conversation";
import { useConversationStore } from "store/conversationStore";
import useSocket from "context/SocketProvider";
import { handleGeneratingConversation } from "@repo/utils/index";
import { getSession } from "next-auth/react";

const { setSelectedConversation } = useConversationStore.getState().conversationActions;

const useConversation = () => {
  const { sendRequestToRegisterConversation, sendRequestToRegisterUserConversation } = useSocket();

  const startConversation = useCallback(async (user: IUser) => {
    if (!user) return;

    const conversation = findUserConversation(user.id);

    if (conversation) setSelectedConversation(conversation.id);
    else {
      const { user: sender } = (await getSession())!;
      const { conversation: newConversation, userConversations } = handleGeneratingConversation(user!, sender!);

      sendRequestToRegisterConversation(newConversation);
      sendRequestToRegisterUserConversation(userConversations);
    }
  }, []);

  const startSystemConversation = useCallback(async (user: IUser) => {
    if (!user) return;

    const { user: sender } = (await getSession())!;
    const { conversation, userConversations } = handleGeneratingConversation(user!, sender!);

    sendRequestToRegisterConversation(conversation);
    sendRequestToRegisterUserConversation(userConversations);
  }, []);

  return {
    startConversation
  };
};

export default useConversation;
