import { useChat } from "@ai-sdk/react";
import { UIMessage } from "@interfaces/aiInterface";
import { IMessage } from "@interfaces/messageInterface";
import { DefaultChatTransport } from "ai";
import ObjectID from "bson-objectid";
import useAuth from "hooks/useAuth";
import { useEffect, useMemo, useRef } from "react";
import { useConversationStore } from "store/conversationStore";
import { useMessageStore } from "store/messageStore";

function useAiChat() {
  const { user } = useAuth();
  const selectedConversation = useConversationStore((s) => s.selectedConversation);
  const updateConversation = useConversationStore((s) => s.conversationActions.updateConversation);
  const setMessageHistory = useMessageStore((s) => s.setMessageHistory);
  const messagesRef = useRef<IMessage[]>([]);

  const {
    messages: aiMessages,
    resumeStream,
    ...rest
  } = useChat<UIMessage>({
    id: selectedConversation!.id,
    generateId: () => new ObjectID().toHexString(),
    resume: localStorage.getItem("resume-stream") === "true",
    transport: new DefaultChatTransport({
      body: () => {
        const msgId = new ObjectID().toHexString();
        const messageTimestamp = Date.now();

        return {
          conversationId: selectedConversation!.conversationId,
          userId: user?.id,
          msgId,
          messageTimestamp,
        };
        2;
      },
      prepareReconnectToStreamRequest: () => {
        return {
          api: `/api/chat/${selectedConversation!.conversationId}/stream`,
        };
      },
      prepareSendMessagesRequest: ({ messages, body }) => {
        const lastMessage = messages.slice(-1)[0];
        const reply = lastMessage?.metadata?.reply;
        const messageHistory = useMessageStore.getState().messageHistory.get(selectedConversation!.id) || [];
        const last5Messages: UIMessage[] = messageHistory.slice(-5).map((msg) => ({
          id: msg.id,
          role: msg.from === user?.id ? "user" : "assistant",
          parts: [{ type: "text" as const, text: msg.message }],
        }));

        if (reply) {
          const replyContext = `The user is replying specifically to this message:\n"${reply.message}"`;
          last5Messages.push(
            ...messages.slice(0, -1),
            {
              id: reply.messageId,
              role: "user",
              parts: [{ type: "text" as const, text: replyContext }],
            },
            lastMessage
          );
        } else {
          last5Messages.push(...messages);
        }

        localStorage.setItem("resume-stream", "true");

        return { body: { id: selectedConversation!.id, messages: last5Messages.slice(-5), ...body } };
      },
    }),
    onError: (error) => {
      console.log(error.message);
      localStorage.setItem("resume-stream", "false");
      messagesRef.current.push(aiMessages.at(-1)?.metadata!);
      rest.setMessages((pre) => {
        pre.pop();
        return pre;
      });
    },
    onFinish: (s) => {
      messagesRef.current.push(...s.messages.slice(-2).map((m) => m.metadata!));
      localStorage.setItem("resume-stream", "false");
    },
  });

  const messages = useMemo(
    () =>
      aiMessages
        .map((m) => {
          if (m.metadata) return m.metadata!;
        })
        .filter(Boolean) as IMessage[],
    [aiMessages]
  );

  useEffect(() => {
    const conversationId = selectedConversation?.id;
    if (!conversationId) return;

    return () => {
      if (messagesRef.current.length > 0) {
        const history = new Map();
        history.set(conversationId, messagesRef.current);
        updateConversation(conversationId, { recentMessage: messagesRef.current.at(-1) });
        setMessageHistory(history);
      }
    };
  }, [selectedConversation?.id]);

  return {
    ...rest,
    messages,
  };
}

export default useAiChat;
