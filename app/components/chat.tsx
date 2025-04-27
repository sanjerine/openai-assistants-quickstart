"use client";

import React, { useState, useEffect, useRef } from "react";
import { AssistantStream } from "openai/lib/AssistantStream";
import Markdown from "react-markdown";
// @ts-expect-error - no types for this yet
import { AssistantStreamEvent } from "openai/resources/beta/assistants/assistants";
import { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs";
import { useTheme } from "../context/ThemeContext";

// Define chat option type
type ChatOption = {
  title: string;
  description: string;
};

type MessageProps = {
  role: "user" | "assistant" | "code";
  text: string;
};

// File ID to filename mapping function - moved outside components
const getFileNameFromId = (fileId) => {
  // Step 1: Create a mapping from full file IDs to actual filenames
  const fileMapping = {
    // Full OpenAI file IDs mapped to your actual filenames
    "file-1gZajGdmDZ14us5CohD1uU":
      "Prevalence and Predictors of Sleep and Trauma Symptoms in Wildfire Survivors_Fadia Isaac.pdf",
    "file-N1iL7bCmaKmLYEk84MaXRp":
      "A Systematic Review of the Impact of Wildfires on Sleep Disturbances.pdf",
    "file-PH7yB4WVSkLHyRwDPDxa6u":
      "Assessment of the Effectiveness_Fadia Isaac.pdf",
    "file-TyF8sXRuvbaSddDp35ebgu":
      "Differences in Anxiety, Insomnia, and Trauma Symptoms in Wildfire Survivors from Aus, Canada and USA.pdf",
    "file-518AMr5rugyLouPUqKgPoJ":
      "Pre-existing depression, anxiety and trauma as risk factors for the development of post-traumatic stress disorder symptoms following wildfires.pdf",
    "file-NyXyh8TewLEgj737Lq4KHY":
      "Cognitive behavioural therapy-based treatments for insomnia and nightmares in adults with trauma symptoms - a systematic review.pdf",
    // Add more mappings as needed
  };

  // Step 2: Check if we have a direct mapping for the full file ID
  if (fileMapping[fileId]) {
    return fileMapping[fileId];
  }

  // Step 3: If no direct mapping, try to extract a meaningful name
  // Remove any emoji or text prefixes if present (like "📄 ")
  let displayName = fileId.replace(/^📄\s+/, "");

  // Make sure we have a file extension
  if (!displayName.includes(".")) {
    displayName = `${displayName}.pdf`;
  }

  return displayName;
};

// New component for chat options
const ChatOptions = ({
  onSelectOption,
}: {
  onSelectOption: (text: string) => void;
}) => {
  const { theme } = useTheme();

  // Define default chat options
  const defaultOptions: ChatOption[] = [
    {
      title: "What is the latest research",
      description: "on risk factors for PTSD?",
    },
    {
      title: "How is sleep disturbance affected",
      description: "by wildfires?",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {defaultOptions.map((option, index) => (
        <button
          key={index}
          onClick={() =>
            onSelectOption(`${option.title} ${option.description}`)
          }
          className="text-left p-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-all duration-200 border border-gray-200 dark:border-gray-700"
        >
          <div className="font-medium text-gray-800 dark:text-white">
            {option.title}
          </div>
          <div className="text-gray-600 dark:text-gray-400">
            {option.description}
          </div>
        </button>
      ))}
    </div>
  );
};

const UserMessage = ({ text }: { text: string }) => {
  return (
    <div className="self-end text-dark bg-primary font-medium my-2 p-2 px-4 rounded-2xl max-w-[80%] break-words">
      {text}
    </div>
  );
};

const AssistantMessage = ({ text }: { text: string }) => {
  return (
    <div className="bg-gray-100 dark:bg-gray-700 text-dark dark:text-white my-2 p-2 px-4 rounded-2xl max-w-[80%] self-start break-words">
      <Markdown
        components={{
          a: ({ node, ...props }) => {
            // Check if this is a file download link (from our API)
            if (props.href && props.href.startsWith("/api/files/")) {
              // Extract the file ID from the URL
              const fileId = props.href.split("/").pop();

              // Get the proper filename from our mapping
              const fileName = getFileNameFromId(fileId);

              // Create a shorter display name if needed
              const displayName =
                fileName.length > 40
                  ? fileName.substring(0, 37) + "..."
                  : fileName;

              // Redirect to the public directory instead of API endpoint
              return (
                <a
                  href={`/files/${fileName}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center p-2 my-2 bg-gray-100 dark:bg-gray-600 border border-gray-200 dark:border-gray-500 rounded-lg text-dark dark:text-white hover:bg-amber-50 dark:hover:bg-gray-500 hover:border-primary transition-all duration-200 shadow-sm max-w-full"
                  title={fileName}
                >
                  <div className="text-lg mr-2 flex-shrink-0 text-primary">
                    📄
                  </div>
                  <div className="overflow-hidden text-ellipsis whitespace-nowrap text-[0.95em]">
                    {displayName}
                  </div>
                </a>
              );
            }
            // Regular link
            return (
              <a
                {...props}
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              />
            );
          },
          img: (props) => (
            <img {...props} className="max-w-full my-2 rounded-lg" />
          ),
        }}
      >
        {text}
      </Markdown>
    </div>
  );
};

const CodeMessage = ({ text }: { text: string }) => {
  return (
    <div className="p-2 px-4 bg-gray-200 dark:bg-gray-800 counter-reset-[line] text-dark dark:text-gray-200 my-2 rounded-2xl max-w-[80%] self-start">
      {text.split("\n").map((line, index) => (
        <div key={index} className="mt-1">
          <span className="text-gray-400 mr-2">{`${index + 1}. `}</span>
          {line}
        </div>
      ))}
    </div>
  );
};

const Message = ({ role, text }: MessageProps) => {
  switch (role) {
    case "user":
      return <UserMessage text={text} />;
    case "assistant":
      return <AssistantMessage text={text} />;
    case "code":
      return <CodeMessage text={text} />;
    default:
      return null;
  }
};

type ChatProps = {
  functionCallHandler?: (
    toolCall: RequiredActionFunctionToolCall
  ) => Promise<string>;
};

const Chat = ({
  functionCallHandler = () => Promise.resolve(""), // default to return empty string
}: ChatProps) => {
  const { theme } = useTheme();
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [inputDisabled, setInputDisabled] = useState(false);
  const [threadId, setThreadId] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // automatically scroll to bottom of chat
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // create a new threadID when chat component created
  useEffect(() => {
    const createThread = async () => {
      const res = await fetch(`/api/assistants/threads`, {
        method: "POST",
      });
      const data = await res.json();
      setThreadId(data.threadId);
    };
    createThread();
  }, []);

  const sendMessage = async (text) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/assistants/threads/${threadId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({
            content: text,
          }),
        }
      );
      const stream = AssistantStream.fromReadableStream(response.body);
      handleReadableStream(stream);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
      setInputDisabled(false);
    }
  };

  const submitActionResult = async (runId, toolCallOutputs) => {
    const response = await fetch(
      `/api/assistants/threads/${threadId}/actions`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          runId: runId,
          toolCallOutputs: toolCallOutputs,
        }),
      }
    );
    const stream = AssistantStream.fromReadableStream(response.body);
    handleReadableStream(stream);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;
    sendMessage(userInput);
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "user", text: userInput },
    ]);
    setUserInput("");
    setInputDisabled(true);
    scrollToBottom();
  };

  /* Stream Event Handlers */

  // textCreated - create new assistant message
  const handleTextCreated = () => {
    setIsLoading(false);
    appendMessage("assistant", "");
  };

  // textDelta - append text to last assistant message
  const handleTextDelta = (delta) => {
    if (delta.value != null) {
      appendToLastMessage(delta.value);
    }
    if (delta.annotations != null) {
      annotateLastMessage(delta.annotations);
    }
  };

  // imageFileDone - show image in chat
  const handleImageFileDone = (image) => {
    appendToLastMessage(`\n![${image.file_id}](/api/files/${image.file_id})\n`);
  };

  // toolCallCreated - log new tool call
  const toolCallCreated = (toolCall) => {
    if (toolCall.type != "code_interpreter") return;
    appendMessage("code", "");
  };

  // toolCallDelta - log delta and snapshot for the tool call
  const toolCallDelta = (delta, snapshot) => {
    if (delta.type != "code_interpreter") return;
    if (!delta.code_interpreter.input) return;
    appendToLastMessage(delta.code_interpreter.input);
  };

  // handleRequiresAction - handle function call
  const handleRequiresAction = async (
    event: AssistantStreamEvent.ThreadRunRequiresAction
  ) => {
    const runId = event.data.id;
    const toolCalls = event.data.required_action.submit_tool_outputs.tool_calls;
    // loop over tool calls and call function handler
    const toolCallOutputs = await Promise.all(
      toolCalls.map(async (toolCall) => {
        const result = await functionCallHandler(toolCall);
        return { output: result, tool_call_id: toolCall.id };
      })
    );
    setInputDisabled(true);
    submitActionResult(runId, toolCallOutputs);
  };

  // handleRunCompleted - re-enable the input form
  const handleRunCompleted = () => {
    setInputDisabled(false);
  };

  const handleReadableStream = (stream: AssistantStream) => {
    // messages
    stream.on("textCreated", handleTextCreated);
    stream.on("textDelta", handleTextDelta);

    // image
    stream.on("imageFileDone", handleImageFileDone);

    // code interpreter
    stream.on("toolCallCreated", toolCallCreated);
    stream.on("toolCallDelta", toolCallDelta);

    // events without helpers yet (e.g. requires_action and run.done)
    stream.on("event", (event) => {
      if (event.event === "thread.run.requires_action")
        handleRequiresAction(event);
      if (event.event === "thread.run.completed") handleRunCompleted();
    });
  };

  /*
    =======================
    === Utility Helpers ===
    =======================
  */

  const appendToLastMessage = (text) => {
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      const updatedLastMessage = {
        ...lastMessage,
        text: lastMessage.text + text,
      };
      return [...prevMessages.slice(0, -1), updatedLastMessage];
    });
  };

  const appendMessage = (role, text) => {
    setMessages((prevMessages) => [...prevMessages, { role, text }]);
  };

  const annotateLastMessage = (annotations) => {
    setMessages((prevMessages) => {
      const lastMessage = prevMessages[prevMessages.length - 1];
      const updatedLastMessage = {
        ...lastMessage,
      };

      annotations.forEach((annotation) => {
        if (annotation.type === "file_path") {
          // Get the raw file ID
          const fileId = annotation.file_path.file_id;

          // Get the friendly filename from our mapping
          const fileName = getFileNameFromId(fileId);

          // Create a clickable link with the friendly name but keep the original ID in the href
          const downloadLink = `[${fileName}](/api/files/${fileId})`;
          updatedLastMessage.text = updatedLastMessage.text.replaceAll(
            annotation.text,
            downloadLink
          );
        } else if (annotation.type === "file_citation") {
          // Handle file citations
          const fileId = annotation.file_citation.file_id;
          const fileName = getFileNameFromId(fileId);

          const citation = `[${fileName}](/api/files/${fileId})`;
          updatedLastMessage.text = updatedLastMessage.text.replaceAll(
            annotation.text,
            citation
          );
        }
      });

      return [...prevMessages.slice(0, -1), updatedLastMessage];
    });
  };

  // Handle a chat option selection
  const handleOptionSelect = (text: string) => {
    setUserInput(text);
    // Automatically submit the message after a brief delay to allow the UI to update
    setTimeout(() => {
      // Add the user message to the chat
      setMessages((prev) => [...prev, { role: "user", text }]);
      // Send the message to the API
      sendMessage(text);
      // Clear the input field
      setUserInput("");
      // Disable the input field while waiting for a response
      setInputDisabled(true);
    }, 100);
  };

  return (
    <div className="flex flex-col-reverse h-full w-full overflow-hidden">
      <form
        onSubmit={handleSubmit}
        className="flex w-full p-2 pb-5 order-1 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 z-10 flex-shrink-0"
      >
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          disabled={inputDisabled}
          placeholder="Send a message..."
          className="flex-grow py-4 px-6 mr-2 rounded-full border-2 border-transparent focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-gray-800 bg-gray-100 dark:bg-gray-800 text-black dark:text-white"
        />
        <button
          type="submit"
          disabled={inputDisabled}
          className="py-2 px-6 bg-primary text-dark border-none text-base rounded-full font-semibold hover:bg-amber-500 disabled:bg-gray-300 dark:disabled:bg-gray-700"
        >
          Send
        </button>
      </form>
      <div className="flex-grow overflow-y-auto flex flex-col order-2 whitespace-pre-wrap h-[calc(100%-90px)] bg-white dark:bg-gray-900">
        {messages.length === 0 && (
          <div className="flex flex-col h-full">
            <div className="mt-auto p-4 pb-6">
              <div className="mb-8 px-4">
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
                  Hello there!
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  This is a Proof of Concept RAG chatbot, trained on Mental
                  Health-related research by the NHRA. Try asking it anything
                  about{" "}
                  <span className="text-gray-600 dark:text-gray-400 font-bold">
                    Mental Health Research!
                  </span>
                </p>
              </div>
              <ChatOptions onSelectOption={handleOptionSelect} />
            </div>
          </div>
        )}
        <div className="p-2 flex flex-col">
          {messages.map((message, index) => (
            <Message key={index} role={message.role} text={message.text} />
          ))}
          {isLoading && (
            <div className="flex justify-start my-3 p-2 px-4 bg-gray-100 dark:bg-gray-700 rounded-2xl max-w-[80%] self-start">
              <div className="flex items-center">
                <span className="w-2 h-2 mx-1 bg-primary rounded-full inline-block animate-[bounce_1.4s_infinite_ease-in-out_-0.32s]"></span>
                <span className="w-2 h-2 mx-1 bg-primary rounded-full inline-block animate-[bounce_1.4s_infinite_ease-in-out_-0.16s]"></span>
                <span className="w-2 h-2 mx-1 bg-primary rounded-full inline-block animate-[bounce_1.4s_infinite_ease-in-out]"></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};

export default Chat;
