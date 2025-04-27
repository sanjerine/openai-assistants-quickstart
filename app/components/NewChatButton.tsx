"use client";

import React from "react";
import { useChatContext } from "../context/ChatContext";

const NewChatButton = () => {
  const { requestReset } = useChatContext();

  return (
    <button
      onClick={requestReset}
      className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-primary-dark dark:hover:bg-gray-800 transition-colors text-gray-800 dark:text-white"
      title="Start New Chat"
      aria-label="Start New Chat"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-6 w-6"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
};

export default NewChatButton;
