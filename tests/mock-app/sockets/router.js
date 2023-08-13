import chat from "./chat.js";

export default [
  {
    event: "room1",
    action: chat.publishChatInRoom1,
    policy: "canJoinRoomOne",
  },
  {
    event: "policyError",
    action: chat.chat,
    policy: "canNotCompute",
  },
  {
    event: "chat",
    action: chat.chat,
  },
];
