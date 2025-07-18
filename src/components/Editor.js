import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "../styles/codemirror-themes.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import ACTIONS from "../Actions";
import axios from "axios";
import ChatSection from "./ChatSection";
import { useTheme } from "../context/ThemeContext";
import "./Editor.css";
import {
  fadeIn,
  staggerFadeIn,
  codeEditorAnimation,
  terminalAnimation,
  chatToggleAnimation,
  pulseAnimation,
  successHighlight,
  shakeAnimation,
} from "../utils/animations";

// Import resizing styles
// ✅ Editor Component
const Editor = ({ socketRef, roomId, onCodeChange, username }) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const editorRef = useRef(null);
  const languageRef = useRef(null); // ✅ Language selector reference
  const terminalRef = useRef(null); // Terminal container reference
  const [output, setOutput] = useState(""); // ✅ Terminal output
  const [terminalHeight, setTerminalHeight] = useState(200); // Default terminal height
  const { isDarkTheme } = useTheme(); // Get current theme

  // Language search states
  const [showLanguageSearch, setShowLanguageSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCustomLanguage, setSelectedCustomLanguage] = useState(null);
  const [customLanguageOption, setCustomLanguageOption] = useState(null);

  // List of additional languages supported by JDoodle
  const additionalLanguages = useMemo(
    () => [
      { id: "c", name: "C" },
      { id: "csharp", name: "C#" },
      { id: "go", name: "Go" },
      { id: "kotlin", name: "Kotlin" },
      { id: "php", name: "PHP" },
      { id: "ruby", name: "Ruby" },
      { id: "rust", name: "Rust" },
      { id: "scala", name: "Scala" },
      { id: "swift", name: "Swift" },
      { id: "typescript", name: "TypeScript" },
      { id: "r", name: "R" },
      { id: "perl", name: "Perl" },
      { id: "pascal", name: "Pascal" },
      { id: "fortran", name: "Fortran" },
      { id: "haskell", name: "Haskell" },
      { id: "objectivec", name: "Objective-C" },
      { id: "bash", name: "Bash" },
      { id: "sql", name: "SQL" },
      { id: "dart", name: "Dart" },
      { id: "clojure", name: "Clojure" },
    ],
    []
  );

  // ✅ Update theme when it changes
  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.setOption(
        "theme",
        isDarkTheme ? "code-together-dark" : "code-together-light"
      );
    }
  }, [isDarkTheme]);

  // ✅ Initialize CodeMirror Editor
  useEffect(() => {
    if (!editorRef.current) {
      const textarea = document.getElementById("realtimeEditor");
      if (!textarea) {
        throw new Error("❌ Error: '#realtimeEditor' element not found!");
      }

      editorRef.current = Codemirror.fromTextArea(textarea, {
        mode: { name: "javascript", json: true },
        theme: isDarkTheme ? "code-together-dark" : "code-together-light",
        autoCloseTags: true,
        autoCloseBrackets: true,
        lineNumbers: true,
      });

      // Apply animation to the editor
      const cmElement = editorRef.current.getWrapperElement();
      codeEditorAnimation(cmElement);

      editorRef.current.on("change", () => {
        const code = editorRef.current.getValue();
        onCodeChange(code);
        socketRef.current.emit(ACTIONS.CODE_CHANGE, { roomId, code });
      });
    }

    return () => {
      if (editorRef.current) {
        editorRef.current.toTextArea(); // Properly destroy CodeMirror
        editorRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleCodeChange = ({ code }) => {
      if (editorRef.current) {
        const currentCode = editorRef.current.getValue();
        if (typeof code === "string" && code.trim() !== currentCode.trim()) {
          editorRef.current.setValue(code);
        }
      }
    };

    socket.on(ACTIONS.CODE_CHANGE, handleCodeChange);
    socket.emit(ACTIONS.GET_LATEST_CODE, { roomId });

    return () => {
      socket.off(ACTIONS.CODE_CHANGE, handleCodeChange);
      socket.off(ACTIONS.GET_LATEST_CODE);
    };
  }, [socketRef.current, roomId]);

  // Handle terminal resize
  const handleTerminalResize = useCallback((newHeight) => {
    if (terminalRef.current) {
      // Use animation for smooth resizing
      terminalAnimation.resize(terminalRef.current, newHeight);
      setTerminalHeight(newHeight);
    }
  }, []);

  // Handle keyboard events in the language search modal
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (!showLanguageSearch) return;

      if (event.key === "Escape") {
        setShowLanguageSearch(false);
        // Reset dropdown to previous selection if no custom language was selected
        if (!selectedCustomLanguage && languageRef.current) {
          languageRef.current.value = "nodejs";
        }
      } else if (event.key === "Enter") {
        const filteredLanguages = additionalLanguages.filter(
          (lang) =>
            lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lang.id.toLowerCase().includes(searchQuery.toLowerCase())
        );

        // If there's exactly one match, select it
        if (filteredLanguages.length === 1) {
          const lang = filteredLanguages[0];
          setSelectedCustomLanguage(lang);
          setCustomLanguageOption(lang);
          if (languageRef.current) {
            languageRef.current.value = lang.id;
          }
          setShowLanguageSearch(false);
          successHighlight(languageRef.current);
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    showLanguageSearch,
    selectedCustomLanguage,
    searchQuery,
    additionalLanguages,
  ]);

  // Handle clicks outside the language search modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      const modal = document.querySelector(".language-search-modal");
      if (
        showLanguageSearch &&
        modal &&
        !modal.contains(event.target) &&
        !event.target.closest(".language-dropdown")
      ) {
        setShowLanguageSearch(false);
        // Reset dropdown to previous selection if no custom language was selected
        if (!selectedCustomLanguage && languageRef.current) {
          languageRef.current.value = "nodejs";
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showLanguageSearch, selectedCustomLanguage]);

  // Persist custom language selection when component re-renders
  useEffect(() => {
    if (customLanguageOption && languageRef.current) {
      // Make sure the dropdown value matches the custom language
      languageRef.current.value = customLanguageOption.id;
    }
  }, [customLanguageOption]);

  // Add animations when component mounts and setup terminal resize functionality
  useEffect(() => {
    // Add staggered animation to UI elements
    const options = document.querySelectorAll("select option");
    if (options.length) {
      staggerFadeIn(options, 0.1, 0.2);
    }

    // Setup terminal resize functionality
    if (terminalRef.current) {
      const terminal = terminalRef.current;
      const terminalHeader = terminal.querySelector(".terminal-header");

      if (terminalHeader) {
        let startY = 0;
        let startHeight = 0;

        const startResize = (e) => {
          startY = e.clientY;
          startHeight = parseInt(
            document.defaultView.getComputedStyle(terminal).height,
            10
          );

          document.addEventListener("mousemove", resize);
          document.addEventListener("mouseup", stopResize);

          // Add a class to indicate active resizing
          terminal.classList.add("resizing");
          e.preventDefault();
        };

        const resize = (e) => {
          // Calculate the delta (how much the mouse has moved)
          // Invert the delta to make dragging up increase the size and dragging down decrease it
          const delta = startY - e.clientY;
          // Apply the delta to the starting height
          const newHeight = startHeight + delta;

          // Get the maximum allowed height (viewport height minus space for other elements)
          const maxHeight = window.innerHeight - 350; // Reserve space for editor, controls, etc.

          // Enforce minimum and maximum height constraints
          if (newHeight >= 50 && newHeight <= maxHeight) {
            handleTerminalResize(newHeight);
          } else if (newHeight > maxHeight) {
            // If trying to resize beyond max, set to max height
            handleTerminalResize(maxHeight);
          }
        };

        const stopResize = () => {
          document.removeEventListener("mousemove", resize);
          document.removeEventListener("mouseup", stopResize);
          terminal.classList.remove("resizing");
        };

        terminalHeader.addEventListener("mousedown", startResize);

        // Cleanup event listeners on component unmount
        return () => {
          terminalHeader.removeEventListener("mousedown", startResize);
          document.removeEventListener("mousemove", resize);
          document.removeEventListener("mouseup", stopResize);
        };
      }
    }
  }, [handleTerminalResize]);

  // We don't need to clear chat history when the editor component unmounts
  // Chat history should only be cleared when leaving the room (handled in EditorPage.js)
  // or when the browser is closed (handled in ChatSection.js)

  // 🚀 Run Code Handler with Language Selection
  const runCode = async () => {
    // Get terminal element for animations
    const terminalEl = terminalRef.current;

    if (!editorRef.current) {
      setOutput("⚠️ Error: Code editor not initialized.");
      if (terminalEl) shakeAnimation(terminalEl);
      return;
    }

    const code = editorRef.current.getValue().trim();

    if (!languageRef.current) {
      setOutput("⚠️ Error: Language selection is not available.");
      if (terminalEl) shakeAnimation(terminalEl);
      return;
    }

    const language = languageRef.current.value;

    // Check if "other" is selected but no custom language was chosen
    if (language === "other") {
      setOutput(
        "⚠️ Error: Please select a specific language from the 'Other' options."
      );
      if (terminalEl) shakeAnimation(terminalEl);
      // Show the language search modal
      setShowLanguageSearch(true);
      return;
    }

    // Log the selected language for debugging
    console.log(`Running code with language: ${language}`);
    if (customLanguageOption && language === customLanguageOption.id) {
      console.log(`Using custom language: ${customLanguageOption.name}`);
    }

    if (!code) {
      setOutput("⚠️ Error: No code to run!");
      if (terminalEl) shakeAnimation(terminalEl);
      return;
    }

    setOutput("⏳ Running...");

    // Show terminal with animation
    if (terminalEl) terminalAnimation.update(terminalEl);

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_BACKEND_URL}/run`, // ✅ Corrected endpoint
        {
          code, // ✅ Fixed payload (renamed 'script' to 'code')
          language,
        },
        { timeout: 10000 } // ✅ Moved timeout to third argument
      );

      if (response.data?.output !== undefined) {
        setOutput(response.data.output);
        // Success animation
        if (terminalEl) successHighlight(terminalEl);
      } else {
        setOutput("⚠️ No output received from server.");
        // Error animation
        if (terminalEl) shakeAnimation(terminalEl);
      }
    } catch (error) {
      console.error("❌ Run code failed:", error);

      let errorMessage = "Unknown error occurred.";
      if (error.response) {
        errorMessage = error.response.data?.error || "Server error.";
      } else if (error.request) {
        errorMessage =
          "❌ No response from server. Check your internet connection.";
      } else {
        errorMessage = `❌ Request failed: ${error.message}`;
      }

      setOutput(errorMessage);

      // Error animation
      if (terminalEl) shakeAnimation(terminalEl);
    }
  };

  return (
    <div className="editor-container">
      <div className="editor-main">
        {/* Flexible container for editor and controls */}
        <div
          className="editor-flex-container"
          style={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {/* Code Editor */}
          <div
            style={{ flex: "1 1 auto", minHeight: "200px", overflow: "hidden" }}
          >
            <textarea id="realtimeEditor" name="codeEditor"></textarea>
          </div>
          {/* Language Selector + Run Code */}
          <div className="editor-controls">
            <div className="language-selector">
              <label htmlFor="language-select" className="language-label">
                🛠️ Select Language:
              </label>
              <select
                id="language-select"
                ref={languageRef}
                defaultValue="nodejs"
                onChange={(e) => {
                  // Add highlight animation when language changes
                  successHighlight(e.target);

                  // Show language search modal if "other" is selected
                  if (e.target.value === "other") {
                    setShowLanguageSearch(true);
                  } else {
                    setShowLanguageSearch(false);
                    setSelectedCustomLanguage(null);
                    // Remove custom language option if another language is selected
                    if (
                      customLanguageOption &&
                      e.target.value !== customLanguageOption.id
                    ) {
                      setCustomLanguageOption(null);
                    }
                  }
                }}
                className="language-dropdown"
              >
                <option value="nodejs">JavaScript (Node.js)</option>
                <option value="python3">Python 3</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                {customLanguageOption && (
                  <option value={customLanguageOption.id}>
                    {customLanguageOption.name}
                  </option>
                )}
                <option value="other">Other...</option>
              </select>

              {/* Language Search Modal */}
              {showLanguageSearch && (
                <div className="language-search-modal">
                  <div className="language-search-content">
                    <div className="language-search-header">
                      <h3>Select Language</h3>
                      <button
                        className="close-btn"
                        onClick={() => {
                          setShowLanguageSearch(false);
                          // Reset dropdown to previous selection if no custom language was selected
                          if (!selectedCustomLanguage) {
                            languageRef.current.value = "nodejs";
                          }
                        }}
                      >
                        ✕
                      </button>
                    </div>
                    <div className="language-search-body">
                      <input
                        type="text"
                        placeholder="Search languages..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="language-search-input"
                      />
                      <div className="language-list">
                        {additionalLanguages
                          .filter(
                            (lang) =>
                              lang.name
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase()) ||
                              lang.id
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase())
                          )
                          .map((lang) => (
                            <div
                              key={lang.id}
                              className={`language-item ${
                                selectedCustomLanguage?.id === lang.id
                                  ? "selected"
                                  : ""
                              }`}
                              onClick={() => {
                                setSelectedCustomLanguage(lang);
                                setCustomLanguageOption(lang);
                                // Update the actual select element's value
                                if (languageRef.current) {
                                  languageRef.current.value = lang.id;
                                }
                                setShowLanguageSearch(false);
                                // Add animation to the select element
                                successHighlight(languageRef.current);
                              }}
                            >
                              {lang.name}
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="spacer"></div>
            <div className="button-group">
              <button
                className="btn chat-toggle-btn"
                onClick={(e) => {
                  // Toggle chat visibility without clearing history
                  setIsChatOpen(!isChatOpen);

                  // Add animation when toggling chat
                  if (document.querySelector(".chat-section")) {
                    chatToggleAnimation(
                      document.querySelector(".chat-section"),
                      !isChatOpen
                    );
                  }

                  // Add pulse animation to button
                  pulseAnimation(e.currentTarget);
                }}
              >
                {isChatOpen ? "❌ Close" : "💬 Chat"}
              </button>

              <button
                className="btn run-code-btn"
                onClick={(e) => {
                  // Add pulse animation when clicked
                  pulseAnimation(e.currentTarget);
                  runCode();
                }}
              >
                🚀 Run
              </button>
            </div>
          </div>
        </div>
        {/* Terminal Output */}
        <div
          className="terminal-container"
          ref={terminalRef}
          style={{
            height: `${terminalHeight}px`,
            maxHeight: "calc(100vh - 150px)", // Allow terminal to grow almost full screen
          }}
        >
          <div
            className="terminal-header"
            ref={(el) => {
              // Apply animation when terminal updates
              if (el && output) {
                terminalAnimation.update(el);
              }
            }}
          >
            <div>🖥️ Terminal Output</div>
            <div className="terminal-controls">
              <span className="resize-indicator" title="Drag to resize">
                ⋯
              </span>
            </div>
          </div>
          <pre className="terminal-content">
            {output || "Run your code to see output here..."}
          </pre>
        </div>
      </div>

      {/* ChatPanel Component (Only shows when chat is open) */}
      {isChatOpen && (
        <div
          className="chat-section"
          ref={(el) => {
            // Apply fade-in animation when chat opens
            if (el) {
              fadeIn(el, 0.1, 0.5);
            }
          }}
        >
          <ChatSection
            socketRef={socketRef}
            roomId={roomId}
            username={username}
            onClose={() => {
              // Add shake animation when closing chat
              const chatEl = document.querySelector(".chat-section");
              if (chatEl) {
                shakeAnimation(chatEl);
                // Delay closing to allow animation to complete
                setTimeout(() => setIsChatOpen(false), 500);
              } else {
                setIsChatOpen(false);
              }
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Editor;
