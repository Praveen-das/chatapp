"use client";
import React from "react";
import { StarIcon } from "@heroicons/react/16/solid";
import useSelectedConversation from "@hooks/useSelectedConversation";
import { useConversationStore } from "store/conversationStore";


export function StarredIndicator({ messageId }: { messageId: string; }) {
  const selectedConversation = useConversationStore(s=>s.selectedConversation)
  const conversation = useSelectedConversation(selectedConversation?.id!);
  
  if (!conversation) return;

  const isStarred = conversation?.starred?.some((m) => m.id === messageId);
  return isStarred && <StarIcon className="size-3 text-black/50" />;
}
