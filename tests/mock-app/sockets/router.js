const chat = require('./chat');

module.exports = [{
  event: 'room1',
  action : chat.publishChatInRoom1,
  policy : 'canJoinRoomOne'
},{
  event: 'policyError',
  action : chat.chat,
  policy : 'canNotCompute'
},{
  event: 'chat',
  action: chat.chat
}];
