import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import ACTIONS from "../Actions";
import Client from "../components/Client";
import Editor from "../components/Editor";
import { initSocket } from "../socket";
import { useTheme } from "../context/ThemeContext";
import "./EditorPage.css";
import {
  useLocation,
  useNavigate,
  Navigate,
  useParams,
} from "react-router-dom";

const EditorPage = () => {
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const location = useLocation();
  const reactNavigator = useNavigate();
  const { roomId } = useParams();
  const { isDarkTheme, toggleTheme } = useTheme();

  useEffect(() => {
    if (!roomId) {
      console.error("Room ID is missing! Check your routing.");
      toast.error("Room ID is missing. Redirecting...");
      reactNavigator("/");
    } else {
      console.log("Current Room ID:", roomId);
    }
  }, [roomId, reactNavigator]);

  const [clients, setClients] = useState([]);

  useEffect(() => {
    const init = async () => {
      if (!socketRef.current) {
        socketRef.current = await initSocket();
      }

      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("Socket connection failed, try again later.");
        reactNavigator("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      // Listening for joined event
      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId, isNewUser }) => {
          // Only show toast for new users joining, not for chat messages
          if (username !== location.state?.username && isNewUser) {
            toast.success(`${username} joined the room.`);
            console.log(`${username} joined`);
          }
          setClients(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
        }
      );

      // Listening for disconnected
      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });
    };
    init();
    return () => {
      if (socketRef.current) {
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
        socketRef.current.disconnect();
      }
    };
  }, []);

  async function copyRoomId() {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID has been copied to your clipboard");
    } catch (err) {
      toast.error("Could not copy the Room ID");
      console.error(err);
    }
  }

  function leaveRoom() {
    // Clear chat history for this room when leaving
    try {
      localStorage.removeItem(`chat_history_${roomId}`);
      console.log(`Chat history cleared for room: ${roomId}`);
    } catch (error) {
      console.error("Error clearing chat history:", error);
    }

    reactNavigator("/");
  }

  if (!location.state) {
    return <Navigate to="/" />;
  }

  return (
    <div className={`mainWrap ${isDarkTheme ? "dark-theme" : "light-theme"}`}>
      <div className="aside">
        <div className="asideInner">
          <div className="logo">
            <img
              className="logoImage"
              src="/New_logo.png"
              alt="Code Together Logo"
            />
          </div>
          <div className="connected-users">
            <h3 className="section-title">Connected Users</h3>
            <div className="clientsList">
              {clients.map((client) => (
                <Client key={client.socketId} username={client.username} />
              ))}
            </div>
          </div>
        </div>
        <div className="button-container">
          <button className="btn theme-toggle" onClick={toggleTheme}>
            {isDarkTheme ? "☀️ Light Mode" : "🌙 Dark Mode"}
          </button>
          <button className="btn copyBtn" onClick={copyRoomId}>
            📋 Copy Room ID
          </button>
          <button className="btn leaveBtn" onClick={leaveRoom}>
            🚪 Leave Room
          </button>
        </div>
      </div>
      <div className="editorWrap">
        <Editor
          socketRef={socketRef}
          roomId={roomId}
          username={location.state?.username}
          onCodeChange={(code) => {
            codeRef.current = code;
          }}
        />
      </div>
    </div>
  );
};

export default EditorPage;
