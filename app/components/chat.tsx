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

// Group for multiple documents to be displayed together in a more organized way
const DocumentGroup = ({ documents }) => {
  if (!documents || documents.length === 0) return null;

  return (
    <div className="my-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Referenced Research:
      </h4>
      <div className="space-y-2">
        {documents.map((doc, index) => (
          <DocumentCard
            key={index}
            fileId={doc.fileId}
            fileName={doc.fileName}
            referenceNumber={index + 1}
          />
        ))}
      </div>
    </div>
  );
};

// Updated DocumentCard component with reference numbers
const DocumentCard = ({ fileId, fileName, referenceNumber }) => {
  // Get a shorter display name if needed
  const displayName =
    fileName.length > 40 ? fileName.substring(0, 37) + "..." : fileName;

  // Extract just the main title without the author part for cleaner display
  const mainTitle = fileName.split("_")[0].split(" - ")[0];

  // Get file type to show appropriate icon
  const isPdf = fileName.toLowerCase().endsWith(".pdf");

  return (
    <a
      href={`/files/${fileName}`}
      target="_blank"
      rel="noopener noreferrer"
      className="block overflow-hidden bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 max-w-full"
      title={fileName}
    >
      <div className="flex items-start p-4">
        <div className="flex-shrink-0 mr-4 flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900 text-primary relative">
          {isPdf ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h6v4H7V5zm8 8v-1h-2v1h2zm0-3v-1h-2v1h2zm-8 3v-1H5v1h2zm0-3v-1H5v1h2zm8-3V5h-2v2h2zm-8 0V5H5v2h2z"
                clipRule="evenodd"
              />
            </svg>
          )}
          <div className="absolute -top-2 -right-2 w-5 h-5 bg-primary text-dark text-xs flex items-center justify-center rounded-full font-semibold">
            {referenceNumber}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
            {mainTitle}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">
            {displayName}
          </p>
        </div>
        <div className="flex-shrink-0 ml-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v3.586L7.707 9.293a1 1 0 00-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 10.586V7z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </a>
  );
};

const AssistantMessage = ({ text }: { text: string }) => {
  // To hold document links found in the message
  const [documents, setDocuments] = useState([]);
  // To hold the processed text with reference numbers
  const [processedText, setProcessedText] = useState("");

  // Parse the text to extract document links when component mounts or text changes
  useEffect(() => {
    const extractDocuments = () => {
      // Pattern to match markdown links that point to files
      const linkRegex = /\[([^\]]+)\]\(\/api\/files\/([^)]+)\)/g;
      const docs = [];
      const fileIds = new Set(); // To track unique file IDs
      let match;

      // First pass: collect all unique documents
      while ((match = linkRegex.exec(text)) !== null) {
        const fileId = match[2];
        const fileName = match[1];

        // Only add if this file ID hasn't been seen before
        if (!fileIds.has(fileId)) {
          fileIds.add(fileId);
          docs.push({
            fileName,
            fileId,
            originalText: match[0],
          });
        }
      }

      // Set the deduplicated documents
      setDocuments(docs);

      // Second pass: replace document links with reference numbers
      let processedText = text;
      docs.forEach((doc, index) => {
        // Create a reference number for this document
        const refNumber = index + 1;

        // Replace all occurrences of this document link with the reference number
        const docRegex = new RegExp(
          "\\[" +
            doc.fileName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") +
            "\\]\\(\\/api\\/files\\/" +
            doc.fileId +
            "\\)",
          "g"
        );
        processedText = processedText.replace(
          docRegex,
          `[${doc.fileName} [${refNumber}]](/api/files/${doc.fileId})`
        );
      });

      // Simple reference format that doesn't break formatting
      processedText = processedText.replace(
        /\[([^\]]+) \[(\d+)\]\]\(\/api\/files\/([^)]+)\)/g,
        "$1 [*$2*](/files/$3)"
      );

      setProcessedText(processedText);
    };

    extractDocuments();
  }, [text]);

  // Custom HTML rendering - just going to use HTML directly because the Markdown component
  // is not handling the numbered lists correctly
  const convertToHtml = (text) => {
    // Custom handling for the specific case of numbered lists with headings that we've seen in the screenshot

    // Direct manipulation for ordered lists with bold subheadings
    let htmlContent = text;

    // Handle links first to prevent interference with other processing
    htmlContent = htmlContent.replace(
      /\[\*(\d+)\*\]\(\/files\/([^)]+)\)/g,
      (match, num, fileId) =>
        `<a href="/files/${fileId}" target="_blank" class="font-medium text-inherit">[${num}]</a>`
    );

    // Convert all Markdown bold to HTML bold
    htmlContent = htmlContent.replace(
      /\*\*([^*]+)\*\*/g,
      "<strong>$1</strong>"
    );

    // Get list items - use an approach that works with older JavaScript
    const lines = htmlContent.split("\n");
    let result = [];
    let currentItem = null;
    let itemContent = "";

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const listItemMatch = line.match(
        /^(\d+)\.\s+(?:<strong>|)([^:<]*?)(?:<\/strong>|):(.*)/
      );

      if (listItemMatch) {
        // If we had a previous item, push it to the result
        if (currentItem) {
          result.push(`
          <div class="flex items-start space-x-2 my-3">
            <div class="mt-1 font-medium">${currentItem.number}.</div>
            <div class="flex-1">
              <div class="font-semibold">${currentItem.heading}:</div>
              <div>${itemContent}</div>
            </div>
          </div>`);
        }

        // Start a new item
        currentItem = {
          number: listItemMatch[1],
          heading: listItemMatch[2],
        };
        itemContent = listItemMatch[3] || "";
      } else if (currentItem) {
        // Continue with the current item content
        itemContent += "\n" + line;
      } else if (line.trim()) {
        // Regular paragraph
        result.push(`<p class="mb-4">${line}</p>`);
      }
    }

    // Don't forget to add the last item
    if (currentItem) {
      result.push(`
      <div class="flex items-start space-x-2 my-3">
        <div class="mt-1 font-medium">${currentItem.number}.</div>
        <div class="flex-1">
          <div class="font-semibold">${currentItem.heading}:</div>
          <div>${itemContent}</div>
        </div>
      </div>`);
    }

    return result.join("");
  };

  return (
    <div className="bg-gray-100 dark:bg-gray-700 text-dark dark:text-white my-2 p-2 px-4 rounded-2xl max-w-[80%] self-start break-words">
      {documents.length > 0 ? (
        <div>
          <div
            dangerouslySetInnerHTML={{ __html: convertToHtml(processedText) }}
          />
          <DocumentGroup documents={documents} />
        </div>
      ) : (
        <Markdown
          components={{
            a: ({ node, ...props }) => (
              <a
                {...props}
                className="text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              />
            ),
            img: (props) => (
              <img {...props} className="max-w-full my-2 rounded-lg" />
            ),
            p: ({ children }) => <p className="mb-4">{children}</p>,
          }}
        >
          {processedText}
        </Markdown>
      )}
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
  const [error, setError] = useState(null); // Add error state

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
      try {
        const res = await fetch(`/api/assistants/threads`, {
          method: "POST",
        });

        // Check if response is OK before trying to parse JSON
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(
            `Failed to create thread: ${res.status} ${res.statusText}. ${errorText}`
          );
        }

        const data = await res.json();
        setThreadId(data.threadId);
      } catch (error) {
        console.error("Error creating thread:", error);
        setError(
          `Failed to initialize chat. Please refresh the page and try again. (${error.message})`
        );
      }
    };
    createThread();
  }, []);

  const sendMessage = async (text) => {
    setIsLoading(true);
    setError(null); // Clear any previous errors

    try {
      const response = await fetch(
        `/api/assistants/threads/${threadId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: text,
          }),
        }
      );

      // Check if response is OK before continuing
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API error: ${response.status} ${response.statusText}. ${errorText}`
        );
      }

      // If we have a valid response, create a stream
      const stream = AssistantStream.fromReadableStream(response.body);
      handleReadableStream(stream);
    } catch (error) {
      console.error("Error sending message:", error);
      setIsLoading(false);
      setInputDisabled(false);

      // Add an error message to the chat
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          text: `🚫 Error: ${error.message}. Please try again or refresh the page.`,
        },
      ]);

      setError(`Failed to send message: ${error.message}`);
    }
  };

  const submitActionResult = async (runId, toolCallOutputs) => {
    try {
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

      // Check if response is OK before continuing
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `API error: ${response.status} ${response.statusText}. ${errorText}`
        );
      }

      const stream = AssistantStream.fromReadableStream(response.body);
      handleReadableStream(stream);
    } catch (error) {
      console.error("Error submitting action result:", error);
      setIsLoading(false);
      setInputDisabled(false);

      // Add an error message to the chat
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          role: "assistant",
          text: `🚫 Error processing function call: ${error.message}. Please try again.`,
        },
      ]);

      setError(`Failed to process function call: ${error.message}`);
    }
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
        {error && (
          <div className="bg-red-100 dark:bg-red-900 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-3 mx-4 my-2 rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}
        {messages.length === 0 && !error && (
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
