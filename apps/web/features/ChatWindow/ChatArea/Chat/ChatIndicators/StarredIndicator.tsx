"use client";
import React from "react";
import { StarIcon } from "@heroicons/react/16/solid";
import useSelectedConversation from "@hooks/useSelectedConversation";

export function StarredIndicator({ messageId }: { messageId: string; }) {
  const conversation = useSelectedConversation();
  
  if (!conversation) return;

  const isStarred = conversation?.starred?.some((m) => m.id === messageId);
  return isStarred && <StarIcon className="size-3 text-black/50" />;
}
