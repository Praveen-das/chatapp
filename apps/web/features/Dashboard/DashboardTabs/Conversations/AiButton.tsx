"use client";
import socket from "@lib/ws";
import { motion } from "framer-motion";
import { Brain, SparkSolid } from "iconoir-react";
import { useAttachments } from "store/attachments";
import { useConversationStore } from "store/conversationStore";
import { useStore } from "store/global";

const setAiConversation = useConversationStore.getState().conversationActions.setAiConversation;
const { setSelectedConversation } = useConversationStore.getState().conversationActions;
const setSelectedUser = useStore.getState().setSelectedUser;
const toggleProfile = useStore.getState().toggleProfile;
const setDeviceTab = useStore.getState().setDeviceTab;
const clearImages = useAttachments.getState().clearImages;

export function AiButton() {
  function handleClick() {
    setAiConversation();
    setDeviceTab("chatarea");
    setSelectedUser(null);
    toggleProfile(false);
    clearImages();
    socket.selectedConversation = null;
  }

  return (
    <motion.div initial={false} layout>
      <button onClick={handleClick} className="btn btn-sm btn-circle btn-ghost ">
        <SparkSolid className="size-6" />
      </button>
    </motion.div>
  );
}
