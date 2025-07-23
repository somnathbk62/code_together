import { io } from "socket.io-client";

export const initSocket = async () => {
  const options = {
    "force new connection": true,
    reconnectionAttempts: Infinity,
    timeout: 20000,
    transports: ["websocket", "polling"],
  };
  return io(process.env.REACT_APP_BACKEND_URL, options);
};
