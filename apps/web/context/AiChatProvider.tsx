"use client";

import { createContext, useContext, ReactNode } from "react";
import useAiChatProvider from "@hooks/useAiChat";

export const Context = createContext<ReturnType<typeof useAiChatProvider> | null>(null);

export function AiChatProvider({ children }: { children: ReactNode }) {
  const contextData = useAiChatProvider();
  return <Context.Provider value={contextData}>{children}</Context.Provider>;
}

export function useAiChat() {
  const context = useContext(Context);
  if (!context) {
    throw new Error("useAiChat must be used within a AiChatProvider");
  }
  return context;
}
