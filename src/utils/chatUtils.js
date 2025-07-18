export const formatTimestamp = () => {
  const now = new Date();
  return now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export const storeChatHistory = (roomId, messages) => {
  localStorage.setItem(`chat_${roomId}`, JSON.stringify(messages));
};

export const loadChatHistory = (roomId) => {
  const history = localStorage.getItem(`chat_${roomId}`);
  return history ? JSON.parse(history) : [];
};
