"use client";

import React, { useState } from "react";
import { assistantId } from "../assistant-config";

const Warnings = () => {
  const [loading, setLoading] = useState(false);
  const [newAssistantId, setNewAssistantId] = useState("");

  const fetchAssistantId = async () => {
    setLoading(true);

    const response = await fetch("/api/assistants", { method: "POST" });
    const data = await response.json();
    setNewAssistantId(data.assistantId);

    setLoading(false);
  };

  return (
    <>
      {!assistantId && (
        <div className="p-5 bg-white w-screen h-screen flex flex-col justify-center items-center text-center rounded-xl text-black">
          <h1 className="text-xl font-semibold">
            Start by creating your assistant
          </h1>
          <div className="my-5 text-base">
            Create an assistant and set its ID in{" "}
            <span className="bg-gray-100 rounded-lg px-2">
              app/assistant-config.ts
            </span>
          </div>
          {!newAssistantId ? (
            <button
              onClick={fetchAssistantId}
              disabled={loading}
              className="py-2 px-6 bg-black text-white border-none text-base rounded-full cursor-pointer"
            >
              {loading ? "Loading..." : "Create Assistant"}
            </button>
          ) : (
            <div className="rounded-lg py-2 px-6 bg-black text-white text-base rounded-full">
              {newAssistantId}
            </div>
          )}
        </div>
      )}
    </>
  );
};

export default Warnings;
