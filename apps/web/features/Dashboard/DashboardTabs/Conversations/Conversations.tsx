"use client";
import Searchbar from "@features/ui/Searchbar";
import { useSearch } from "@hooks/useSearch";
import { IQueryResult } from "@repo/interfaces/conversationInterface";
import { AnimatePresence } from "framer-motion";
import { Fragment, useEffect, useMemo, useState } from "react";
import { useStore } from "store/global";
import { useConversationStore } from "../../../../store/conversationStore";
import Conversation from "../SharedComponents/Conversation/Conversation";
import ConversationSkeleton from "../SharedComponents/Conversation/ConversationSkeleton";
import MotionWrapper from "../SharedComponents/Conversation/MotionWrapper";
import Menu_Conversation from "../SharedComponents/MenuContext";
import SearchPrompt from "../SharedComponents/SearchPrompt";
import MainHeader from "./Header";
import { getUserFromMetadata } from "@lib/conversation";

export default function Conversations() {
  return (
    <div className="flex flex-col max-sm:gap-2 sm:gap-4 h-full">
      <MainHeader />
      <DisplayConversations />
    </div>
  );
}

const Skeleton = () => Array.from({ length: 4 }).map((_, index) => <ConversationSkeleton key={index} />);

function DisplayConversations() {
  const queryResult = useSearch((s) => s.queryResult);
  const setQueryResult = useSearch((s) => s.setQueryResult);
  const resetSearch = useSearch((s) => s.reset);
  const selectedConversation = useConversationStore((s) => s.selectedConversation);
  let conversations = useConversationStore((s) => s.conversations);
  let isLoaded = useConversationStore((s) => s.isLoaded);
  let users = useStore((s) => s.users);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let res: IQueryResult = { chats: [], groups: [], contacts: [] };
    console.log(conversations);
    conversations.forEach((c) => {
      if (c.host === "system") return;
      if (c.host === "ai") return;

      let haveMember = c.members.find((m) => {
        const member = getUserFromMetadata(m);
        if (!member) return false;
        member.username?.includes(searchQuery) || member.phoneNumber?.includes(searchQuery);
      });

      if (haveMember) {
        if (c.host === "user") {
          if (!c.active) res.contacts.push(c);
          else res.chats.push(c);
        }
        if (c.host === "group") res.groups.push(c);
      }
    });

    setQueryResult(res);
  }, [searchQuery, conversations, users]);

  useEffect(() => {
    return () => {
      resetSearch();
      setSearchQuery("");
    };
  }, [selectedConversation]);

  useMemo(
    () =>
      conversations.sort((a, b) => {
        let x = a.recentMessage?.timestamp || a.updatedAt;
        let y = b.recentMessage?.timestamp || b.updatedAt;
        return y - x;
      }),
    [conversations],
  );

  return (
    <>
      <Searchbar query={searchQuery} onChange={setSearchQuery} />
      <div className="flex flex-col overflow-hidden h-full">
        <Menu_Conversation />
        <div className="flex flex-1 h-full w-full flex-col mt-4 gap-6 overflow-y-scroll no-scrollbar *:first:z-20">
          {searchQuery ? (
            Object.keys(queryResult).map((key) => {
              let k = key as keyof typeof queryResult;

              if (!queryResult[k].length) {
                if (key === "chats") return <SearchPrompt key="SearchPrompt" query={searchQuery} />;
                return;
              }

              return (
                <Fragment key={key}>
                  <div className="capitalize text-sm">{key}</div>
                  {queryResult[k]?.map((conversation) => (
                    <Conversation
                      key={conversation.id}
                      conversation={conversation}
                      isSelected={selectedConversation?.id === conversation.id}
                    />
                  ))}
                </Fragment>
              );
            })
          ) : !isLoaded ? (
            <Skeleton />
          ) : (
            <AnimatePresence initial={false}>
              {conversations.map(
                (conversation) =>
                  !conversation.archived &&
                  conversation.host !== "ai" &&
                  conversation.active && (
                    <MotionWrapper isSelected={selectedConversation?.id === conversation.id} key={conversation.id}>
                      <Conversation
                        conversation={conversation}
                        isSelected={selectedConversation?.id === conversation.id}
                      />
                    </MotionWrapper>
                  ),
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </>
  );
}
