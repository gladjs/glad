module.exports = {
  publishChatInRoom1 (data, socket) {
    socket.in('room1').emit('room1', data);
  },
  chat (data, socket) {
    socket.emit('chat', data);
  }
};
