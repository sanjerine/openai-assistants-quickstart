"use client";

import React, { useState, useEffect, useRef } from "react";
import styles from "./chat.module.css";
import { AssistantStream } from "openai/lib/AssistantStream";
import Markdown from "react-markdown";
// @ts-expect-error - no types for this yet
import { AssistantStreamEvent } from "openai/resources/beta/assistants/assistants";
import { RequiredActionFunctionToolCall } from "openai/resources/beta/threads/runs/runs";

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

const UserMessage = ({ text }: { text: string }) => {
  return <div className={styles.userMessage}>{text}</div>;
};

const AssistantMessage = ({ text }: { text: string }) => {
  return (
    <div className={styles.assistantMessage}>
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
                  className={styles.fileDownloadLink}
                  title={fileName}
                >
                  <div className={styles.fileIcon}>📄</div>
                  <div className={styles.fileName}>{displayName}</div>
                </a>
              );
            }
            // Regular link
            return <a {...props} target="_blank" rel="noopener noreferrer" />;
          },
        }}
      >
        {text}
      </Markdown>
    </div>
  );
};

const CodeMessage = ({ text }: { text: string }) => {
  return (
    <div className={styles.codeMessage}>
      {text.split("\n").map((line, index) => (
        <div key={index}>
          <span>{`${index + 1}. `}</span>
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

  return (
    <div className={styles.chatContainer}>
      <div className={styles.messages}>
        {messages.map((msg, index) => (
          <Message key={index} role={msg.role} text={msg.text} />
        ))}
        {isLoading && (
          <div className={styles.loadingMessage}>
            <div className={styles.loadingDots}>
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={handleSubmit}
        className={`${styles.inputForm} ${styles.clearfix}`}
      >
        <input
          type="text"
          className={styles.input}
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Enter your question"
          disabled={inputDisabled}
        />
        <button
          type="submit"
          className={styles.button}
          disabled={inputDisabled}
        >
          {isLoading ? "Loading..." : "Send"}
        </button>
      </form>
    </div>
  );
};

export default Chat;
