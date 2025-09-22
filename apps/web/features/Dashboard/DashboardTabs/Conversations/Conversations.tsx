"use client";
import { Fragment, useEffect, useMemo, useState } from "react";
import Conversation from "../SharedComponents/Conversation/Conversation";
import { useConversationStore } from "../../../../store/conversationStore";
import MainHeader from "./Header";
import Menu_Conversation from "../SharedComponents/MenuContext";
import { IQueryResult } from "@repo/interfaces/conversationInterface";
import { useSearch } from "@hooks/useSearch";
import SearchPrompt from "../SharedComponents/SearchPrompt";
import Searchbar from "@features/ui/Searchbar";
import { useStore } from "store/global";
import { AnimatePresence, motion } from "framer-motion";
import MotionWrapper from "../SharedComponents/Conversation/MotionWrapper";

export default function Conversations() {
  return (
    <div className="flex flex-col max-sm:gap-2 sm:gap-4 h-full">
      <MainHeader />
      <DisplayConversations />
    </div>
  );
}

function DisplayConversations() {
  const selectedConversation = useConversationStore((s) => s.selectedConversation);
  const [searchQuery, setSearchQuery] = useState("");
  const queryResult = useSearch((s) => s.queryResult);
  const setQueryResult = useSearch((s) => s.setQueryResult);
  const resetSearch = useSearch((s) => s.reset);
  let conversations = useConversationStore((s) => s.conversations);
  let users = useStore((s) => s.users);

  useEffect(() => {
    let res: IQueryResult = { chats: [], groups: [], contacts: [] };

    conversations.forEach((c) => {
      if (c.host === "system") return;

      let haveMember = c.members.find((m) => m.username?.includes(searchQuery) || m.phoneNumber?.includes(searchQuery));

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

  useMemo(() => conversations.sort((a, b) => b.updatedAt - a.updatedAt), [conversations]);

  useEffect(() => {
    return () => resetSearch();
  }, []);

  return (
    <>
      <Searchbar onChange={setSearchQuery} />
      <div className="flex flex-col overflow-hidden h-full">
        <Menu_Conversation />
        <div className="flex flex-1 h-full w-full flex-col mt-4 gap-6 overflow-y-scroll no-scrollbar [&>:first-child]:z-20">
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
          ) : conversations.length ? (
            <AnimatePresence initial={false}>
              {conversations.map(
                (conversation) =>
                  !conversation.archived &&
                  conversation.active && (
                    <MotionWrapper isSelected={selectedConversation?.id === conversation.id} key={conversation.id}>
                      <Conversation
                        conversation={conversation}
                        isSelected={selectedConversation?.id === conversation.id}
                      />
                    </MotionWrapper>
                  )
              )}
            </AnimatePresence>
          ) : null}
        </div>
      </div>
    </>
  );
}
