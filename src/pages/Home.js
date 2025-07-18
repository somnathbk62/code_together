import React, { useState } from "react";
import { v4 as uuidV4 } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";
import "./Home.css";

const Home = () => {
  const navigate = useNavigate();
  const { isDarkTheme, toggleTheme } = useTheme();

  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");
  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidV4();
    setRoomId(id);
    toast.success("Created a new room");
  };

  const joinRoom = () => {
    if (!roomId || !username) {
      toast.error("ROOM ID & username is required");
      return;
    }

    // Redirect
    navigate(`/editor/${roomId}`, {
      state: {
        username,
      },
    });
  };

  const handleInputEnter = (e) => {
    if (e.code === "Enter") {
      joinRoom();
    }
  };
  return (
    <div
      className={`homePageWrapper ${
        isDarkTheme ? "dark-theme" : "light-theme"
      }`}
    >
      <div className="formWrapper">
        <div className="logo-container">
          <img
            className="homePageLogo"
            src="/New_logo.png"
            alt="Code Together Logo"
          />
        </div>
        <h4 className="mainLabel">Code Together</h4>
        <div className="form-content">
          <div className="form-group">
            <label htmlFor="roomId">Room ID</label>
            <input
              id="roomId"
              type="text"
              placeholder="Enter room ID"
              onChange={(e) => setRoomId(e.target.value)}
              value={roomId}
              onKeyUp={handleInputEnter}
            />
          </div>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              placeholder="Enter your username"
              onChange={(e) => setUsername(e.target.value)}
              value={username}
              onKeyUp={handleInputEnter}
            />
          </div>
          <button className="btn btn-primary" onClick={joinRoom}>
            ✨ Join Session
          </button>
          <div className="create-room">
            <p>Don't have an invite?</p>
            <button onClick={createNewRoom} className="btn btn-secondary">
              🎨 Create New Room
            </button>
          </div>
        </div>
      </div>
      <div className="theme-toggle-container">
        <button className="btn theme-toggle" onClick={toggleTheme}>
          {isDarkTheme ? "☀️ Light Mode" : "🌙 Dark Mode"}
        </button>
      </div>
      <footer className="home-footer">
        <p>© 2025 Code Together - Real-time Collaborative Coding</p>
      </footer>
    </div>
  );
};

export default Home;
