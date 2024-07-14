import { eventEmitter } from "../server";
import { AppEvents, SocketEvents } from "../events";
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
import { Server, Socket } from "socket.io";
import { DecodedPayload } from "../types/DecodedPayload";
import { KickMemberFromGroupHandler } from "./handlers/kick-member-from-group";
import { addNewMembersToGroupHandler } from "./handlers/add-new-members-to-group";

export const socketHandler = (
  socket: Socket,
  io: Server,
  payload: DecodedPayload
) => {
  console.log(`my username is ${payload.username}`);

  const socketParams = {
    socket,
    io,
    payload,
  };

  socket.on(SocketEvents.IS_ONLINE, (data) =>
    isOnlineHandler(socketParams, data)
  );

  socket.on(SocketEvents.IS_TYPING, (data) =>
    isTypingHandler(socketParams, data)
  );

  socket.on(SocketEvents.IS_NOT_TYPING, (data) =>
    isNotTypingHandler(socketParams, data)
  );

  socket.on(SocketEvents.SEND_PRIVATE_MESSAGE, (data) =>
    sendPrivateMsgHandler(socketParams, data)
  );

  socket.on(SocketEvents.JOIN_GROUP, (data) =>
    joinGroupHandler(socketParams, data)
  );

  socket.on(SocketEvents.LEAVE_GROUP, (data) =>
    leaveGroupHandler(socketParams, data)
  );

  socket.on(SocketEvents.SEND_GROUP_MESSAGE, (data) =>
    sendGroupMsgHandler(socketParams, data)
  );

  socket.on(SocketEvents.DELETE_MESSAGE, (data) =>
    deleteMsgHandler(socketParams, data)
  );

  socket.on(SocketEvents.EXIT_GROUP, (data) =>
    exitGroupHandler(socketParams, data)
  );

  eventEmitter.on(AppEvents.GROUP_CREATED, (data) =>
    groupCreatedHandler(socketParams, data)
  );

  socket.on(SocketEvents.UPDATE_GROUP_DETAILS, (data) =>
    updateGroupDetailsHandler(socketParams, data)
  );

  socket.on(SocketEvents.KICK_MEMBER, (data) =>
    KickMemberFromGroupHandler(socketParams, data)
  )

  socket.on(SocketEvents.ADD_NEW_MEMBER_TO_GROUP, (data) =>
    addNewMembersToGroupHandler(socketParams, data)
  )
};
