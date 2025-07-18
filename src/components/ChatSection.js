// File: src/components/ChatSection.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import "./ChatSection.css";
import ErrorMessage from "./ErrorMessage";
import {
  storeFile,
  createDownloadUrl,
  downloadFile,
  retryOperation,
} from "../utils/fileStorage";

// Helper function to get file icon based on file extension
const getFileIcon = (fileName) => {
  if (!fileName) return "📄";
  const extension = fileName.split(".").pop().toLowerCase();

  // Image files
  if (["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(extension)) {
    return "🖼️";
  }

  // Document files
  if (["doc", "docx", "txt", "rtf", "odt"].includes(extension)) {
    return "📝";
  }

  // PDF files
  if (extension === "pdf") {
    return "📕";
  }

  // Spreadsheet files
  if (["xls", "xlsx", "csv", "ods"].includes(extension)) {
    return "📊";
  }

  // Presentation files
  if (["ppt", "pptx", "odp"].includes(extension)) {
    return "📊";
  }

  // Code files
  if (
    [
      "js",
      "jsx",
      "ts",
      "tsx",
      "html",
      "css",
      "json",
      "py",
      "java",
      "c",
      "cpp",
    ].includes(extension)
  ) {
    return "💻";
  }

  // Archive files
  if (["zip", "rar", "7z", "tar", "gz"].includes(extension)) {
    return "🗄️";
  }

  // Default
  return "📄";
};

// Helper function to check if a file is an image
const isImageFile = (fileName) => {
  if (!fileName) return false;
  const extension = fileName.split(".").pop().toLowerCase();
  return ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg"].includes(
    extension
  );
};

// IMPORTANT: Add a prop for username so each client has a unique sender identity
const ChatSection = ({ roomId, onClose, username, socketRef }) => {
  // <-- Updated to include username
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  // const [users, setUsers] = useState([]);
  const [typingUser, setTypingUser] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    file: null,
  });
  const [error, setError] = useState({
    isOpen: false,
    message: "",
    retryAction: null,
  });
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);
  const fileData = useRef({}); // Store file data for previews

  // Get the localStorage key for this room's chat history
  const chatStorageKey = `chat_history_${roomId}`;

  // Function to save messages to localStorage
  const saveMessagesToLocalStorage = useCallback(
    (msgs) => {
      try {
        localStorage.setItem(chatStorageKey, JSON.stringify(msgs));
      } catch (error) {
        console.error("Error saving chat history to localStorage:", error);
      }
    },
    [chatStorageKey]
  );

  // Function to clear chat history from localStorage
  const clearChatHistory = useCallback(() => {
    try {
      localStorage.removeItem(chatStorageKey);
      console.log(`Chat history cleared for room: ${roomId}`);
    } catch (error) {
      console.error("Error clearing chat history:", error);
    }
  }, [chatStorageKey, roomId]);

  // Function to load messages from localStorage
  const loadMessagesFromLocalStorage = useCallback(() => {
    try {
      const savedMessages = localStorage.getItem(chatStorageKey);
      if (savedMessages) {
        return JSON.parse(savedMessages);
      }
    } catch (error) {
      console.error("Error loading chat history from localStorage:", error);
    }
    return [];
  }, [chatStorageKey]);

  // Function to scroll to the bottom of the chat
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  // Theme is now handled globally through ThemeContext

  const handleIncomingMessage = useCallback(
    (message) => {
      // Check if this message is already in our state (to avoid duplicates)
      const isDuplicate = messages.some(
        (msg) => msg.messageId === message.messageId
      );
      if (!isDuplicate) {
        console.log("Received message:", message);
        setMessages((prev) => [
          ...prev,
          {
            ...message,
            text: safeDecode(message.text),
          },
        ]);
        // Scroll to bottom when new message arrives
        setTimeout(scrollToBottom, 100);
      }
    },
    [messages, scrollToBottom]
  );

  // We're not using this function directly in this component
  // It's handled in EditorPage.js when the user leaves the room

  // Function to format message text with @mentions
  const formatMessageWithMentions = (text) => {
    if (!text) return "";

    // Regular expression to find @mentions
    const mentionRegex = /@(\w+)/g;

    // Split the text by @mentions and create an array of text and mention spans
    const parts = [];
    let lastIndex = 0;
    let match;

    // Use a temporary div to safely parse the text
    const tempDiv = document.createElement("div");
    tempDiv.textContent = text;
    const safeText = tempDiv.innerHTML;

    // Find all @mentions in the text
    while ((match = mentionRegex.exec(safeText)) !== null) {
      // Add the text before the @mention
      if (match.index > lastIndex) {
        parts.push(safeText.substring(lastIndex, match.index));
      }

      // Add the @mention as a span with the mention class
      const mention = match[0]; // The full @username
      parts.push(`<span class="mention">${mention}</span>`);

      lastIndex = match.index + mention.length;
    }

    // Add any remaining text after the last @mention
    if (lastIndex < safeText.length) {
      parts.push(safeText.substring(lastIndex));
    }

    return parts.join("");
  };

  // Effect to load messages from localStorage when component mounts
  useEffect(() => {
    const savedMessages = loadMessagesFromLocalStorage();
    if (savedMessages && savedMessages.length > 0) {
      setMessages(savedMessages);
    }
  }, [loadMessagesFromLocalStorage]);

  // Effect to save messages to localStorage when they change
  useEffect(() => {
    if (messages.length > 0) {
      saveMessagesToLocalStorage(messages);
    }
  }, [messages, saveMessagesToLocalStorage]);

  // Effect to scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (!roomId) {
      console.error("Chat Section: Room ID is missing! Cannot join room.");
      return;
    }

    console.log("Chat Section - Joining Room:", roomId);
    // Use the existing socket connection from the parent component
    socketRef.current.emit("join-room", roomId);

    // Set up event listeners for chat functionality
    socketRef.current.on("RECEIVE_MESSAGE", handleIncomingMessage);

    // Typing indicator handlers
    socketRef.current.on("USER_TYPING", ({ username: userTyping }) => {
      // Only show typing indicator for other users, not ourselves
      if (userTyping !== username) {
        setTypingUser(userTyping);

        // Auto-clear typing indicator after 12 seconds as a fallback
        // in case the stopTyping event is missed (slightly longer than the 10-second timeout)
        setTimeout(() => {
          setTypingUser(null);
        }, 12000);
      }
    });

    socketRef.current.on("stopTyping", () => setTypingUser(null));

    // Listen for room leave events to clear chat history
    const handleBeforeUnload = () => {
      // Clear chat history when the page is unloaded (browser close, refresh, navigate away)
      // This is a browser exit event, so we should clean up
      clearChatHistory();
    };

    // Add event listener for page unload
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Store references to avoid React Hook dependency warnings
    const currentSocketRef = socketRef.current;
    const currentFileData = { ...fileData.current };

    return () => {
      // Clean up event listeners when component unmounts
      currentSocketRef.off("RECEIVE_MESSAGE", handleIncomingMessage);
      currentSocketRef.off("USER_TYPING");
      currentSocketRef.off("stopTyping");

      // Make sure to clear any pending typing timeouts
      clearTimeout(typingTimeout.current);

      // Remove window event listeners
      window.removeEventListener("beforeunload", handleBeforeUnload);

      // Ensure typing indicator is turned off when component unmounts
      currentSocketRef.emit("stopTyping");

      // Clean up file URLs to prevent memory leaks
      Object.values(currentFileData).forEach((file) => {
        if (file.url) {
          URL.revokeObjectURL(file.url);
        }
      });

      // Don't clear chat history when component unmounts
      // This allows the chat history to persist when closing/reopening the chat
      // The history will only be cleared when leaving the room or closing the browser
    };
  }, [roomId, handleIncomingMessage, username, clearChatHistory]);

  const safeDecode = (text) => {
    try {
      return atob(text);
    } catch (error) {
      return text;
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        setInput(""); // Clear text input when file is selected

        // Generate a unique ID for the file
        const fileId = Date.now().toString();

        // Show loading state
        setError({
          isOpen: true,
          message: `Uploading file: ${file.name}...`,
          retryAction: null,
        });

        // Store file data in IndexedDB with retry mechanism
        await retryOperation(
          async () => {
            await storeFile({
              id: fileId,
              name: file.name,
              type: file.type,
              size: file.size,
              file: file,
              isImage: isImageFile(file.name),
            });
          },
          3,
          1000
        );

        // Create a temporary URL for preview
        const fileUrl = URL.createObjectURL(file);

        // Store file data for preview
        fileData.current[fileId] = {
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size,
          url: fileUrl,
          isImage: isImageFile(file.name),
        };

        // Set file ID to be sent with the message
        file.fileId = fileId;
        setFilePreview(file);

        // Close loading message
        setError({
          isOpen: false,
          message: "",
          retryAction: null,
        });

        console.log(`File stored with ID: ${fileId}`);
      } catch (err) {
        console.error("Error uploading file:", err);
        setError({
          isOpen: true,
          message: `Failed to upload file: ${err.message || "Unknown error"}`,
          retryAction: () => handleFileUpload({ target: { files: [file] } }),
        });
      }
    }
  };

  // Function to open the preview modal
  const openPreviewModal = async (file) => {
    try {
      // Show loading state
      setError({
        isOpen: true,
        message: `Loading preview: ${file.fileName || file.text}...`,
        retryAction: null,
      });

      // If the file has a fileId but no fileUrl, try to get it from IndexedDB
      if (file.fileId && !file.fileUrl) {
        // Use retry mechanism for getting file URL
        const fileData = await retryOperation(
          async () => {
            return await createDownloadUrl(file.fileId);
          },
          3,
          1000
        );

        file = { ...file, fileUrl: fileData.url };
      }

      // Close loading message
      setError({
        isOpen: false,
        message: "",
        retryAction: null,
      });

      setPreviewModal({
        isOpen: true,
        file,
      });
    } catch (err) {
      console.error("Error opening preview:", err);
      setError({
        isOpen: true,
        message: `Failed to open file preview: ${
          err.message || "Unknown error"
        }`,
        retryAction: () => openPreviewModal(file),
      });
    }
  };

  // Function to close the preview modal
  const closePreviewModal = () => {
    setPreviewModal({
      isOpen: false,
      file: null,
    });
  };

  // Function to close the error modal
  const closeErrorModal = () => {
    setError({
      isOpen: false,
      message: "",
      retryAction: null,
    });
  };

  // Function to handle file download
  const handleFileDownload = async (fileId, fileName) => {
    try {
      console.log(`Downloading file with ID: ${fileId}`);

      // Show loading state
      setError({
        isOpen: true,
        message: `Preparing download: ${fileName}...`,
        retryAction: null,
      });

      // Download file with retry mechanism
      await retryOperation(
        async () => {
          await downloadFile(fileId, fileName);
        },
        3,
        1000
      );

      // Close loading message
      setError({
        isOpen: false,
        message: "",
        retryAction: null,
      });
    } catch (err) {
      console.error("Error downloading file:", err);
      setError({
        isOpen: true,
        message: `Failed to download file: ${err.message || "Unknown error"}`,
        retryAction: () => handleFileDownload(fileId, fileName),
      });
    }
  };

  const sendMessage = () => {
    if (input.trim() === "" && !filePreview) return;
    // Use the passed username instead of hardcoding "You"
    const messageId = Date.now(); // Unique ID for tracking status

    // Create message object
    const newMessage = {
      messageId,
      roomId,
      sender: username, // <-- Changed from "You" to username prop
      text: filePreview ? filePreview.name : btoa(input),
      timestamp: new Date().toLocaleTimeString(),
      status: "sent",
      isFile: !!filePreview,
    };

    // Add file data if this is a file message
    if (filePreview) {
      // Add file metadata
      newMessage.fileId = filePreview.fileId;
      newMessage.fileName = filePreview.name;
      newMessage.fileType = filePreview.type;
      newMessage.fileSize = filePreview.size;
      newMessage.isImage = isImageFile(filePreview.name);
    }

    // Emit message to server with consistent roomId property
    socketRef.current.emit(
      "SEND_MESSAGE",
      { roomId, message: newMessage, sender: username }, // <-- Changed key "room" to "roomId" and added sender
      (acknowledgment) => {
        if (acknowledgment && acknowledgment.success) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.messageId === newMessage.messageId
                ? { ...msg, status: "delivered" }
                : msg
            )
          );
        }
      }
    );

    // Optimistically update local chat
    setMessages((prev) => [
      ...prev,
      {
        ...newMessage,
        text: filePreview ? filePreview.name : input,
        // If this is a file message, add the file URL for local preview
        fileUrl: filePreview ? fileData.current[filePreview.fileId]?.url : null,
      },
    ]);

    // Clear input and file preview
    setInput("");
    setFilePreview(null);

    // Scroll to bottom after sending a message
    setTimeout(scrollToBottom, 100);
  };

  // State for scroll to bottom button visibility
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Function to handle scroll events
  const handleScroll = useCallback(() => {
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } =
        chatContainerRef.current;
      // Show button when scrolled up more than 100px from bottom
      const isScrolledUp = scrollHeight - scrollTop - clientHeight > 100;
      setShowScrollButton(isScrolledUp);
    }
  }, []);

  // Add scroll event listener
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.addEventListener("scroll", handleScroll);
      return () => chatContainer.removeEventListener("scroll", handleScroll);
    }
  }, [handleScroll]);

  // Function to scroll to bottom when button is clicked
  const scrollToBottomHandler = () => {
    scrollToBottom();
  };

  return (
    <div className="chat-container">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-title">
          <span className="chat-header-icon">💬</span>
          <span className="chat-header-text">
            Chat Room: {roomId || "Unknown Room"}
          </span>
        </div>
        <div className="chat-header-actions">
          <button
            className="close-chat"
            onClick={() => {
              // Just close the chat without clearing history
              onClose();
            }}
          >
            ✖
          </button>
        </div>
      </div>
      {/* Messages Container */}
      <div
        className="chat-messages"
        ref={chatContainerRef}
        onScroll={handleScroll}
      >
        {messages.map((msg, index) => (
          <React.Fragment key={index}>
            {index === 0 ||
            new Date(msg.timestamp).toDateString() !==
              new Date(messages[index - 1].timestamp).toDateString() ? (
              <div className="date-separator">
                <div className="date-separator-line"></div>
                <div className="date-separator-text">
                  {new Date(msg.timestamp).toLocaleDateString()}
                </div>
                <div className="date-separator-line"></div>
              </div>
            ) : null}
            <div
              // Determine class based on whether the sender matches our username
              className={`message ${msg.sender === username ? "own" : "other"}`}
            >
              {/* Message Header with Username and Badge */}
              <div className="message-header">
                <span className="user-badge"></span>
                <span>{msg.sender}</span>
              </div>

              {/* Message Content */}
              <div className="message-content">
                {!msg.isFile && (
                  <div
                    dangerouslySetInnerHTML={{
                      __html: formatMessageWithMentions(msg.text),
                    }}
                  />
                )}

                {/* File Preview */}
                {msg.isFile && (
                  <div className="file-preview-container">
                    <div className="file-preview">
                      <div className="file-preview-header">
                        <span className="file-preview-icon">
                          {getFileIcon(msg.fileName || msg.text)}
                        </span>
                        <span className="file-preview-name">
                          {msg.fileName || msg.text}
                        </span>
                        <div className="file-preview-actions">
                          <button
                            className="file-preview-action-btn"
                            onClick={() => openPreviewModal(msg)}
                            title="View"
                          >
                            👁️
                          </button>
                          <button
                            className="file-preview-action-btn"
                            onClick={() =>
                              handleFileDownload(
                                msg.fileId,
                                msg.fileName || msg.text
                              )
                            }
                            title="Download"
                          >
                            ⬇️
                          </button>
                        </div>
                      </div>

                      {/* Image Preview */}
                      {msg.isImage && (
                        <div className="file-preview-content">
                          {msg.fileUrl ? (
                            <img
                              src={msg.fileUrl}
                              alt={msg.fileName || msg.text}
                              className="image-preview"
                              onClick={() => openPreviewModal(msg)}
                            />
                          ) : (
                            <div
                              className="image-preview-placeholder"
                              onClick={() => openPreviewModal(msg)}
                            >
                              <span>Click to view image</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Message Footer with Timestamp and Status */}
              <div className="message-footer">
                <span className="timestamp">{msg.timestamp}</span>
                {msg.sender === username && (
                  <span className={`status ${msg.status}`}>
                    {msg.status === "read"
                      ? "✓✓"
                      : msg.status === "delivered"
                      ? "✓✓"
                      : "✓"}
                  </span>
                )}
              </div>
            </div>
          </React.Fragment>
        ))}
        {typingUser && (
          <div className="typing-indicator">
            <span>
              <strong>{typingUser}</strong> is typing...
            </span>
            <div className="typing-dots">
              {[1, 2, 3].map((i) => (
                <div key={i} className="dot" />
              ))}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />

        {/* Scroll to bottom button */}
        {showScrollButton && (
          <div
            className={`scroll-to-bottom ${showScrollButton ? "visible" : ""}`}
            onClick={scrollToBottomHandler}
            title="Scroll to bottom"
          >
            ↓
          </div>
        )}
      </div>
      {/* Input Area */}
      <div className="chat-footer">
        <input
          type="file"
          id="file-upload"
          ref={fileInputRef}
          className="file-input"
          onChange={handleFileUpload}
        />
        <label htmlFor="file-upload" className="upload-btn" title="Upload file">
          📎
        </label>
        <div className="message-input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              const newValue = e.target.value;
              setInput(newValue);

              // Only emit typing event if there's actual content
              if (newValue.trim() !== "") {
                socketRef.current.emit("TYPING", { roomId, username });

                // Clear any existing timeout
                clearTimeout(typingTimeout.current);

                // Set a new timeout to stop typing indicator after 10 seconds of inactivity
                typingTimeout.current = setTimeout(() => {
                  socketRef.current.emit("stopTyping");
                }, 10000);
              } else {
                // If input is empty, immediately stop typing indicator
                clearTimeout(typingTimeout.current);
                socketRef.current.emit("stopTyping");
              }
            }}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Type your message..."
            className="message-input"
          />
          <button className="emoji-btn" title="Add emoji">
            😊
          </button>
        </div>
        <button className="send-btn" onClick={sendMessage}>
          <span className="send-btn-icon">↗</span>
          <span>Send</span>
        </button>
      </div>

      {/* Preview Modal */}
      {previewModal.isOpen && (
        <div className="preview-modal" onClick={closePreviewModal}>
          <div
            className="preview-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="preview-modal-header">
              <div className="preview-modal-title">
                {previewModal.file?.fileName || previewModal.file?.text}
              </div>
              <button
                className="preview-modal-close"
                onClick={closePreviewModal}
              >
                &times;
              </button>
            </div>
            <div className="preview-modal-body">
              {previewModal.file?.isImage ? (
                <img
                  src={previewModal.file.fileUrl}
                  alt={previewModal.file.fileName || previewModal.file.text}
                  style={{ maxWidth: "100%", maxHeight: "70vh" }}
                />
              ) : (
                <div className="document-preview">
                  {/* Simple document preview - in a real app, you might use a document viewer library */}
                  <p>
                    Document preview not available. Please download the file to
                    view its contents.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Error Modal */}
      {error.isOpen && (
        <ErrorMessage
          message={error.message}
          onRetry={error.retryAction}
          onClose={closeErrorModal}
        />
      )}
    </div>
  );
};

export default ChatSection;
