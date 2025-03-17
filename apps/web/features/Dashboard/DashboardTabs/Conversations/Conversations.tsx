"use client";
import { Fragment, useEffect, useMemo, useState } from "react";
import Conversation from "../SharedComponents/Conversation/Conversation";
import { useConversationStore } from "../../../../store/conversationStore";
import SearchUser from "../../../ui/Searchbar";
import MainHeader from "./Header";
import Menu_Conversation from "../SharedComponents/MenuContext";
import { debounce } from "@lib/query";
import useAxios from "@hooks/useAxios";
import { IGroupConversation, IQueryResult, IUserConversation } from "@interfaces/conversationInterface";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { IUser } from "@interfaces/userInterface";
import Avatar from "@features/ui/Avatar";
import { useStore } from "store/global";
import { useSearch } from "@hooks/useSearch";

export default function Conversations() {
  return (
    <div className="flex flex-col max-sm:gap-2 sm:gap-4 h-full">
      <MainHeader />
      <Menu_Conversation />
      <DisplaySearchbar />
      <DisplayConversations />
    </div>
  );
}

function DisplaySearchbar() {
  const setSearchQuery = useSearch((s) => s.setSearchQuery);
  return <SearchUser onChange={setSearchQuery} />;
}

function DisplayConversations() {
  const selectedConversation = useConversationStore((s) => s.selectedConversation);
  const searchQuery = useSearch((s) => s.searchQuery);
  const queryResult = useSearch((s) => s.queryResult);
  const setQueryResult = useSearch((s) => s.setQueryResult);
  const setQueriedUser = useStore.getState().setFetchedUserUser;
  const conversations = useConversationStore((s) => s.conversations);
  const axios = useAxios();

  useEffect(() => {
    let res: IQueryResult = { chats: [], groups: [] };

    conversations.forEach((c) => {
      let haveMember =
        c.active && c.members.find((m) => m.username?.includes(searchQuery) || m.phoneNumber?.includes(searchQuery));

      if (haveMember) {
        if (c.host === "user") res.chats.push(c);
        if (c.host === "group") res.groups.push(c);
      }

      setQueryResult(res);
    });
  }, [searchQuery, conversations]);

  useMemo(() => conversations.sort((a, b) => b.updatedAt - a.updatedAt), [conversations]);

  const handleSearchQuery = debounce(async () => {
    const res = await axios.get(`/db/user/search?q=${searchQuery}`).then((res) => res.data);
    setQueriedUser(res);
    useStore.getState().setDashboardTab("fetchedUser");
  }, 300);

  return (
    <div className="flex flex-col overflow-hidden">
      <div className="flex flex-1 h-full w-full flex-col mt-4 gap-2 overflow-y-scroll no-scrollbar">
        {
          searchQuery
            ? Object.keys(queryResult).map((key) => {
                let k = key as keyof typeof queryResult;

                if (!queryResult[k].length) {
                  if (key === "chats")
                    return (
                      <div
                        key={key}
                        onClick={handleSearchQuery}
                        className="group hover:cursor-pointer bg-base-200 outline-2 mb-8 rounded-2xl p-4 flex justify-center items-center gap-2 text-sm"
                      >
                        <MagnifyingGlassIcon className="size-5" />
                        Search for <span className="group-hover:underline text-primary">{searchQuery}</span>
                      </div>
                    );
                  return;
                }

                return (
                  <Fragment key={key}>
                    <div className="capitalize text-sm">{key}</div>
                    {queryResult[k]?.map(
                      (conversation) =>
                        !conversation.archived &&
                        conversation.active && (
                          <Conversation
                            key={conversation.id}
                            conversation={conversation}
                            isSelected={selectedConversation?.conversationId === conversation.conversationId}
                          />
                        )
                    )}
                  </Fragment>
                );
              })
            : conversations.map(
                (conversation) =>
                  !conversation.archived &&
                  conversation.active && (
                    <Conversation
                      key={conversation.id}
                      conversation={conversation}
                      isSelected={selectedConversation?.conversationId === conversation.conversationId}
                    />
                  )
              )
        }
      </div>
    </div>
  );
}
