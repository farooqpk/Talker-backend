import { eventEmitter } from "../server";
import { AppEvents, SocketEvents } from "../events";
import { SOCKET_PAYLOAD, SOCKET } from "../utils/configureSocketIO";
import { isNotTypingHandler } from "./handlers/is-not-typing";
import { isOnlineHandler } from "./handlers/is-online";
import { isTypingHandler } from "./handlers/is-typing";
import { sendPrivateMsgHandler } from "./handlers/send-private-msg";
import { joinGroupHandler } from "./handlers/join-group";
import { leaveGroupHandler } from "./handlers/leave-group";
import { sendGroupMsgHandler } from "./handlers/send-group-msg";
import { deleteMsgHandler } from "./handlers/delete-msg";
import { exitGroupHandler } from "./handlers/exit-group";
import { groupCreatedHandler } from "./handlers/group-created";
import { updateGroupDetailsHandler } from "./handlers/update-group-details";

export const socketHandler = () => {
  console.log(`my username is ${SOCKET_PAYLOAD.username}`);

  SOCKET.on(SocketEvents.IS_ONLINE, isOnlineHandler);

  SOCKET.on(SocketEvents.IS_TYPING, isTypingHandler);

  SOCKET.on(SocketEvents.IS_NOT_TYPING, isNotTypingHandler);

  SOCKET.on(SocketEvents.SEND_PRIVATE_MESSAGE, sendPrivateMsgHandler);

  SOCKET.on(SocketEvents.JOIN_GROUP, joinGroupHandler);

  SOCKET.on(SocketEvents.LEAVE_GROUP, leaveGroupHandler);

  SOCKET.on(SocketEvents.SEND_GROUP_MESSAGE, sendGroupMsgHandler);

  SOCKET.on(SocketEvents.DELETE_MESSAGE, deleteMsgHandler);

  SOCKET.on(SocketEvents.EXIT_GROUP, exitGroupHandler);

  eventEmitter.on(AppEvents.GROUP_CREATED, groupCreatedHandler);

  SOCKET.on(SocketEvents.UPDATE_GROUP_DETAILS, updateGroupDetailsHandler);
};
