"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import useSocket from "../../../context/SocketProvider";
import {
  generateConversation,
  generateUserConversations,
} from "@lib/conversation";
import { useConversationStore } from "../../../store/conversationStore";
import { useMessageStore } from "../../../store/messageStore";
import SearchUser from "../Searchbar";
import { useStore } from "../../../store/global";
import { User } from "./components/User";
import { Conversation } from "./components/Conversation";
import useAuth from "../../../hooks/useAuth";
import {
  IConversation,
  IUserConversation,
} from "../../../interfaces/conversationInterface";
import { IMessage } from "../../../interfaces/messageInterface";
import { IUser } from "../../../interfaces/userInterface";
import { IModal } from "@interfaces/modalInterface";
import { regenerateMessageTemplate } from "@lib/messages";

export const ForwardMessageModal = ({ title }: { title: string }) => {
  const { user } = useAuth();
  const setMessageStore = useMessageStore((s) => s.setMessageStore);
  const setConversation = useConversationStore((s) => s.setConversation);
  const updateConversation = useConversationStore((s) => s.updateConversation);

  const {
    sendMessage,
    sendRequestToRegisterConversation,
    sendRequestToRegisterUserConversation,
  } = useSocket();
  const conversations = useConversationStore((s) => s.conversations);
  const _users = useStore((s) => s.users);
  const modal = useStore<IModal<IMessage[]> | null>((s) => s.modal);

  const [selectedUsers, setSelectedUsers] = useState<IUser[]>([]);
  const [selectedConversations, setSelectedConversations] = useState<
    IConversation[]
  >([]);
  const [query, setQuery] = useState("");

  const users = _users.filter(
    (u) =>
      !conversations.find(
        (c) => c.host === "user" && c.members.find((m) => m.id === u.id)
      )
  );

  const conversationsQueryResult = useMemo(() => {
    if (!query) return [];
    return conversations.filter((c) => c.displayName?.includes(query));
  }, [query, conversations]);

  const usersQueryResult = useMemo(() => {
    if (!query) return [];
    return users.filter((user) => user.username.includes(query));
  }, [query, users]);

  const selectedChats = modal?.state || [];

  const handleSelectedUsers = (user: IUser) => {
    setSelectedUsers((s) =>
      s.includes(user) ? s.filter((u) => u.id !== user.id) : [user, ...s]
    );
  };

  const handleSelectedConversation = (conversation: IConversation) => {
    setSelectedConversations((s) =>
      s.includes(conversation)
        ? s.filter((u) => u.id !== conversation.conversationId)
        : [conversation, ...s]
    );
  };

  const handleMessageForward = () => {
    const userConversationsForCurrentUser: IUserConversation[] = [];

    selectedUsers.forEach((selectedUser) => {
      let conversation = generateConversation(user!, selectedUser);
      let userConversations = generateUserConversations(conversation);

      userConversations.forEach((c) => {
        if (c.userId === user?.id) {
          setConversation(c);
          userConversationsForCurrentUser.push(c);
        }
      });

      sendRequestToRegisterConversation(conversation);
      sendRequestToRegisterUserConversation(userConversations);
    });

    [...selectedConversations, ...userConversationsForCurrentUser].forEach(
      (conversation) => {
        let messages = selectedChats.map((message) => {
          let newMessage = regenerateMessageTemplate(conversation, message);
          return newMessage;
        });

        sendMessage(conversation, messages);
        setMessageStore(conversation.id, messages);
        updateConversation(conversation.id, {
          recentMessage: messages.at(-1),
        });
      }
    );

    setSelectedUsers([]);
    setSelectedConversations([]);
    useStore.getState().setModal(null);
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
    <div className="modal-box max-sm:max-w-full max-sm:max-h-full max-sm:rounded-none max-sm:pt-4 pb-0 max-sm:w-full max-sm:h-full h-full px-0 relative flex flex-col max-w-[450px] bg-[--modal]">
      <div className="flex max-sm:px-4 px-6 justify-between items-center w-full">
        <h3 className="font-medium text-lg">{title}</h3>
        <form method="dialog">
          <button className="btn btn-circle btn-sm btn-ghost">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-6 h-6"
            >
              <path
                fillRule="evenodd"
                d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </form>
      </div>
      <div className="max-sm:px-4 px-6 mt-4">
        <SearchUser onChange={setQuery} />
      </div>
      <div className="w-full h-full space-y-2 overflow-y-scroll no-scrollbar mt-4">
        <span className="flex w-full max-sm:px-4 pl-6 pt-2 pb-1 text-sm">
          Recents Chats
        </span>
        {(query ? conversationsQueryResult : conversations).map(
          (conversation) => (
            <div
              key={conversation.id}
              onClick={() => handleSelectedConversation(conversation)}
            >
              <Conversation
                isSelected={selectedConversations.includes(conversation)}
                conversation={conversation}
              />
            </div>
          )
        )}
        <span className="flex w-full max-sm:px-4 pl-6 pt-2 pb-1 text-sm">
          All Contacts
        </span>
        {(query ? usersQueryResult : users).map((person) => (
          <div key={person.id} onClick={() => handleSelectedUsers(person)}>
            <User isSelected={selectedUsers.includes(person)} person={person} />
          </div>
        ))}
      </div>
      {/* <div className="flex items-center w-full h-20 bg-base-200 px-4 gap-2">
                <div className="flex items-center text-xs w-full h-full whitespace-nowrap overflow-hidden">
                    {placeholder.map((string, idx) => (
                        <Fragment key={string}>
                            <label className="truncate" htmlFor="">{string}</label>
                            {selectedUsers.length > 0 && selectedUsers.length !== idx + 1 ? ' , ' : ''}
                        </Fragment>
                    ))}
                </div>
                <form method="dialog">
                    <button disabled={!(selectedConversations.length + selectedUsers.length)} onClick={handleMessageForward}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                            <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
                        </svg>
                    </button>
                </form>
            </div> */}

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
              className="btn btn-circle btn-primary text-white grid place-items-center size-14 bg-primary rounded-full overflow-hidden"
            >
              <motion.svg
                initial={item.hidden}
                animate={item.visible}
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
              </motion.svg>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
