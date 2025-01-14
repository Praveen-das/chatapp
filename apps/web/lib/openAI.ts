import { IMessage } from "@interfaces/messageInterface";
import OpenAI from "openai";
import { decrypt } from "./e2e";
import useAuth from "@hooks/useAuth";
import { useConversationStore } from "store/conversationStore";
import { useMessageStore } from "store/messageStore";

const openai = new OpenAI({
  apiKey:
    "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",
  dangerouslyAllowBrowser: true,
});

const generate = async (promptExplanation: string, promptInput: string) => {
  return promptInput;
  // const result = await openai.chat.completions.create({
  //   model: "gpt-4o-mini",
  //   store: true,
  //   messages: [
  //     {
  //       role: "developer",
  //       content: promptExplanation,
  //     },
  //     {
  //       role: "user",
  //       content: promptInput,
  //     },
  //   ],
  // });

  // return result.choices[0]?.message;
};

const getMessagesSummary = async (messages: Partial<IMessage>[]) => {
  if (!messages?.length) return 'No messages found';

  const input = createChatConversation(messages);
  const promptExplanation = `
              You are a helpful assistant who generate a concise and meaningful summary 
              of a conversation. This is particularly useful for long or busy chats where 
              users need a quick overview of key points, decisions, or action items.
            `;
  return await generate(promptExplanation, input);
};

const getSmartReply = async (messages: Partial<IMessage>[]) => {
  if (!messages?.length) return 'No messages found';

  const input = createChatConversation(messages);
  const promptExplanation = `
              You are a helpful assistant who generate context-aware, concise, and 
              relevant reply suggestions for ongoing conversations. You processes the 
              most recent chat messages and analyzes the context, tone, and intent of 
              the conversation. Based on this analysis, the system suggests quick replies 
              that align with the user’s communication style, the relationship with the recipient, 
              and the chat's purpose.
            `;
  return await generate(promptExplanation, input);
};

const createChatConversation = (messages: Partial<IMessage>[]) => {
  const user = useAuth.getState().user;
  return messages.map(
      (m) => `${m.from === user?.id ? "sara" : "david"}: ${decrypt(m.message!)}`
    )
    .join("\n");
};

function ai() {
  const conversation = useConversationStore.getState().selectedConversation;
  let messages = useMessageStore
    .getState()
    .unreadMessages.get(conversation?.id!);

  if (!messages?.length)
    messages = useMessageStore
  .getState()
  .messageStore.get(conversation?.id!)
  ?.slice(-5);
    
  return {
    getSmartReply: () => getSmartReply(messages!),
    getMessagesSummary: () => getMessagesSummary(messages!),
  };
}

export { ai, getMessagesSummary, getSmartReply };
