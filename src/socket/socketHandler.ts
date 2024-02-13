import { Server, Socket } from "socket.io";
import { DecodedPayload } from "../types/DecodedPayload";
import {prisma} from '../utils/prisma'

export const socketHandler = (
  socket: Socket,
  io: Server,
  decodedPayload: DecodedPayload
) => {
  console.log(`my username is ${decodedPayload.username}`);

  // socket.on("chat", async (data: ChatMsg) => {
  //   const { message, recipient } = data;

  //   const recipientId = await getSocketsFromRedis(recipient);

  //   if (typeof recipientId === "string") {
  //     socket
  //       .to(recipientId as string)
  //       .emit("chat", { sender: decodedPayload.username, message });
  //   } else {
  //     socket.emit("offline", "now recipient is offline");
  //   }
  // });

  // socket.on("status", async (recipient) => {
  //   const IsrecipientExist = await getSocketsFromRedis(recipient);
  //   if (IsrecipientExist) socket.emit("status", { status: "online" });
  //   else socket.emit("status", { status: "offline" });
  // });
};
