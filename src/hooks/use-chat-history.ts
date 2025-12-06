"use client";

import { useLocalStorage } from "usehooks-ts";

export type ChatHistoryItem = {
  id: string;
  fileName: string;
  createdAt: string;
};

const STORAGE_KEY = "chat-history";

export function useChatHistory() {
  const [chatHistory, setChatHistory] = useLocalStorage<ChatHistoryItem[]>(
    STORAGE_KEY,
    []
  );

  function addChat(chat: Omit<ChatHistoryItem, "createdAt">) {
    setChatHistory(prev => [
      { ...chat, createdAt: new Date().toISOString() },
      ...prev,
    ]);
  }

  function removeChat(id: string) {
    setChatHistory(prev => prev.filter(chat => chat.id !== id));
  }

  function clearHistory() {
    setChatHistory([]);
  }

  return {
    chatHistory,
    addChat,
    removeChat,
    clearHistory,
  };
}
