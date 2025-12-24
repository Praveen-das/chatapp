"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import useSocket from "../../../context/SocketProvider";
import { useConversationStore } from "../../../store/conversationStore";
import SearchUser from "../Searchbar";
import { useStore } from "../../../store/global";
import { User } from "./components/User";
import { Conversation } from "./components/Conversation";
import { IConversation } from "@repo/interfaces/conversationInterface";
import { IMessage } from "@repo/interfaces/messageInterface";
import { IUser } from "@repo/interfaces/userInterface";
import { regenerateMessageTemplate } from "@lib/messages";
import { IModal } from "@interfaces/modalInterface";
import { SendSolid } from "iconoir-react";
import ModalTitle from "./components/ModalTitle";
import FramerWrapper from "../MotionWrapper";
import { useUsers } from "@hooks/useUsers";

export const ForwardMessageModal = ({ title }: { title: string }) => {
  const { sendMessage } = useSocket();
  const conversations = useConversationStore((s) => s.conversations);
  const users = useUsers();
  const modal = useStore<IModal<IMessage[]> | null>((s) => s.modal);

  const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);
  const [selectedConversations, setSelectedConversations] = useState<IConversation[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  const conversationsQueryResult = useMemo(() => {
    if (!query) return [];
    return conversations.filter((c) => (c?.host === "user" || c?.host === "group") && c.displayName?.includes(query));
  }, [query, conversations]);

  const usersQueryResult = useMemo(() => {
    if (!query) return [];
    return users.filter((user) => user.username.includes(query));
  }, [query, users]);

  const selectedChats = modal?.state || [];

  const handleSelectedUsers = (user: IUser) => {
    setSelectedUsers((s) => (s.includes(user) ? s.filter((u) => u.id !== user.id) : [user, ...s]));
  };

  const handleSelectedConversation = (conversation: IConversation) => {
    setSelectedConversations((s) =>
      s.includes(conversation) ? s.filter((u) => u.id !== conversation.id) : [conversation, ...s]
    );
  };

  const handleMessageForward = () => {
    if (loading) return;

    setLoading(true);

    selectedConversations.forEach(async (conversation) => {
      let messages = await Promise.all(
        selectedChats.map((message) => {
          let newMessage = regenerateMessageTemplate(conversation, message);
          return newMessage;
        })
      );

      try {
        await sendMessage({ conversation, messages });
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    });

    setSelectedUsers([]);
    setSelectedConversations([]);
    useStore.getState().setModal(false);
  };

  const container = {
    hidden: { scale: 0 },
    visible: {
      scale: 1,
      transition: {
        delayChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { y: 50, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { delay: 0.1 } },
  };

  return (
    <FramerWrapper
      className={`modal-box max-sm:max-w-full max-sm:max-h-full max-sm:rounded-none max-sm:pt-4 pb-0 max-sm:w-full max-sm:h-full h-full px-0 relative flex flex-col max-w-[450px] bg-[--modal]`}
    >
      <ModalTitle>{title}</ModalTitle>
      <div className="max-sm:px-4 px-6 mt-4">
        <SearchUser query={query} onChange={setQuery} />
      </div>
      <div className="w-full h-full space-y-2 overflow-y-scroll no-scrollbar mt-4">
        <span className="flex w-full max-sm:px-4 pl-6 pt-2 pb-1 text-sm">Recents Chats</span>
        {(query ? conversationsQueryResult : conversations).map(
          (conversation) =>
            conversation.host === "user" ||
            (conversation.host === "group" && (
              <div key={conversation.id} onClick={() => handleSelectedConversation(conversation)}>
                <Conversation isSelected={selectedConversations.includes(conversation)} conversation={conversation} />
              </div>
            ))
        )}
        <span className="flex w-full max-sm:px-4 pl-6 pt-2 pb-1 text-sm">All Contacts</span>
        {(query ? usersQueryResult : users).map((person) => (
          <div key={person.id} onClick={() => handleSelectedUsers(person)}>
            <User isSelected={selectedUsers.includes(person)} person={person} />
          </div>
        ))}
      </div>

      <AnimatePresence>
        {(!!selectedUsers.length || !!selectedConversations.length) && (
          <motion.div
            variants={container}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="absolute bottom-6 right-6"
          >
            <div
              onClick={handleMessageForward}
              className="btn btn-circle btn-primary text-[--black-white] grid place-items-center size-14 bg-primary rounded-full overflow-hidden"
            >
              <motion.span initial={item.hidden} animate={item.visible}>
                <SendSolid className="size-5" />
              </motion.span>
              {/* <motion.svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 16 16"
                fill="currentColor"
                className="size-6"
              >
                <path
                  fillRule="evenodd"
                  d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z"
                  clipRule="evenodd"
                />
              </motion.svg> */}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </FramerWrapper>
  );
};
