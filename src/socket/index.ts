import { eventEmitter } from "../main";
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
import { readMessageStatusHandler } from "./handlers/read-msg-status";
import { setAsAdminHandler } from "./handlers/set-as-admin";
import { deleteGroupHandler } from "./handlers/delete-group";
import { setPeerIdHandler } from "./handlers/set-peerid";
import { getRecipientPeerIdHandler } from "./handlers/get-peerid";
import { endCallHandler } from "./handlers/end-call";
import { rejectCallHandler } from "./handlers/reject-call";

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

  eventEmitter.once(AppEvents.GROUP_CREATED, (data) =>
    groupCreatedHandler(socketParams, data)
  );

  socket.on(SocketEvents.UPDATE_GROUP_DETAILS, (data) =>
    updateGroupDetailsHandler(socketParams, data)
  );

  socket.on(SocketEvents.KICK_MEMBER, (data) =>
    KickMemberFromGroupHandler(socketParams, data)
  );

  socket.on(SocketEvents.ADD_NEW_MEMBER_TO_GROUP, (data) =>
    addNewMembersToGroupHandler(socketParams, data)
  );

  socket.on(SocketEvents.READ_MESSAGE, (data) =>
    readMessageStatusHandler(socketParams, data)
  );

  socket.on(SocketEvents.SET_ADMIN, (data) =>
    setAsAdminHandler(socketParams, data)
  );

  socket.on(SocketEvents.DELETE_GROUP, (data) =>
    deleteGroupHandler(socketParams, data)
  );

  socket.on(SocketEvents.SET_PEER_ID, (data) => {
    setPeerIdHandler(socketParams, data);
  });

  socket.on(SocketEvents.GET_RECIPIENT_PEER_ID, (data) => {
    getRecipientPeerIdHandler(socketParams, data);
  });

  socket.on(SocketEvents.END_CALL, (data) => {
    endCallHandler(socketParams, data);
  });

  socket.on(SocketEvents.REJECT_CALL, (data) => {
    rejectCallHandler(socketParams, data);
  });
};
