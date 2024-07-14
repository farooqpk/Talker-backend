export enum SocketEvents {
  IS_ONLINE = "isOnline",
  IS_TYPING = "isTyping",
  IS_NOT_TYPING = "isNotTyping",
  SEND_PRIVATE_MESSAGE = "sendPrivateMessage",
  JOIN_GROUP = "joinGroup",
  LEAVE_GROUP = "leaveGroup",
  SEND_GROUP_MESSAGE = "sendMessageForGroup",
  DELETE_MESSAGE = "deleteMessage",
  EXIT_GROUP = "exitGroup",
  UPDATE_GROUP_DETAILS = "updateGroupDetails",
  CONNECTION = 'connection',
  IS_CONNECTED = 'isConnected',
  IS_DISCONNECTED = 'isDisconnected',
  UN_AUTHORIZED = 'unauthorized',
  DISCONNECT = 'disconnect',
  KICK_MEMBER = "kickMember",
  ADD_NEW_MEMBER_TO_GROUP = "addNewMemberToGroup",
}

export enum AppEvents {
  GROUP_CREATED = "groupCreated",
}
