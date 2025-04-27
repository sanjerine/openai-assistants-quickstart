"use client";

import React, { createContext, useState, useContext, ReactNode } from "react";

interface ChatContextType {
  resetKey: number; // Use a key to signal reset
  requestReset: () => void;
}

// Provide a default value matching the type, or undefined if checks are implemented
const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [resetKey, setResetKey] = useState(0);

  const requestReset = () => {
    console.log("Reset requested, incrementing key..."); // Add log for debugging
    setResetKey((prevKey) => prevKey + 1); // Increment key to trigger reset effect
  };

  return (
    <ChatContext.Provider value={{ resetKey, requestReset }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};
