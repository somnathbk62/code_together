const express = require("express");
const http = require("http");
const path = require("path");
const cors = require("cors");
const { Server } = require("socket.io");
const ACTIONS = require("./src/Actions");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// ✅ CORS Configuration
const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"],
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

const userSocketMap = {};
const codeRef = {}; // ✅ Store latest code for each room

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    // Store the username in the userSocketMap
    userSocketMap[socket.id] = username;
    socket.join(roomId);

    // Get all clients in the room
    const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
      (socketId) => ({ socketId, username: userSocketMap[socketId] })
    );

    // Check if this is a new user or a reconnection
    const isNewUser = clients.length > 1; // More than 1 means there were already users in the room

    // Notify all clients in the room
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
        roomId,
        isNewUser, // Add flag to indicate if this is a new user joining
      });
    });
  });

  // Handle join-room event for chat component
  socket.on("join-room", (roomId) => {
    console.log(`Socket ${socket.id} joining chat room: ${roomId}`);
    socket.join(roomId);
  });

  // Add chat message handlers
  socket.on("SEND_MESSAGE", ({ roomId, message, sender }, callback) => {
    console.log(`Broadcasting message to room ${roomId} from ${sender}`);
    // Use socket.to() to broadcast to everyone in the room EXCEPT the sender
    // This prevents the sender from receiving their own message twice
    socket.to(roomId).emit("RECEIVE_MESSAGE", message);

    // Send acknowledgment back to the sender
    if (callback) {
      callback({ success: true });
    }
  });

  // Add typing indicator handler
  socket.on("TYPING", ({ roomId, username }) => {
    // Broadcast typing event to everyone in the room except the sender
    socket.to(roomId).emit("USER_TYPING", { username });
  });

  // Handle stop typing event
  socket.on("stopTyping", () => {
    // Get all rooms this socket is in
    const rooms = Array.from(socket.rooms).filter((room) => room !== socket.id);

    // Broadcast stop typing to all rooms this user is in
    rooms.forEach((roomId) => {
      socket.to(roomId).emit("stopTyping");
    });
  });

  // Add file sharing handler
  socket.on("SHARE_FILE", ({ roomId, fileData, sender }) => {
    io.in(roomId).emit("FILE_SHARED", {
      fileData,
      sender,
      timestamp: Date.now(),
    });
  });

  // Other socket event handlers...

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    codeRef[roomId] = code; // ✅ Save latest code in memory
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.GET_LATEST_CODE, ({ socketId, roomId }) => {
    process.nextTick(() => {
      const latestCode = codeRef[roomId] || "";
      io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code: latestCode });
    });
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });

      // ✅ Cleanup codeRef if room is empty
      const remainingClients = io.sockets.adapter.rooms.get(roomId);
      if (!remainingClients || remainingClients.size === 0) {
        delete codeRef[roomId];
      }
    });

    delete userSocketMap[socket.id];
    socket.leave();
  });
});

// Import the rate limiter
const rateLimit = require("express-rate-limit");

// Create a limiter: max 10 requests per minute
const codeExecutionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { output: "Rate limit exceeded. Please wait before retrying." },
});

// Import necessary libraries
const axios = require("axios");
require("dotenv").config();

// Apply the rate limiter to the /run endpoint
app.post("/run", codeExecutionLimiter, async (req, res) => {
  try {
    const { code, language } = req.body;

    // Validate code for unsafe keywords
    if (/(process|require|eval|spawn|exec|fs|child_process)/.test(code)) {
      return res.status(400).json({
        output: "Invalid code: Potentially unsafe keywords detected!",
      });
    }

    // ✅ Prepare JDoodle API request
    const jdoodleURL = "https://api.jdoodle.com/v1/execute";
    const payload = {
      clientId: process.env.JD_API_CLIENT_ID,
      clientSecret: process.env.JD_API_CLIENT_SECRET,
      script: code,
      language: language || "nodejs",
      versionIndex: "4",
    };

    // ✅ Send request to JDoodle API
    const response = await axios.post(jdoodleURL, payload);

    // ✅ Send back the execution result
    res.json({ output: response.data.output });
  } catch (err) {
    console.error("JDoodle API Error:", err);
    res
      .status(500)
      .json({ output: "Internal server error while executing code" });
  }
});

// ✅ Serve React frontend
app.use(express.static("public"));
app.use((req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

// ✅ Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
