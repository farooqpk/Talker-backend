import { Server, Socket } from "socket.io";
import { ChatMsg } from "../types/ChatMsgType";
import { getSocketsFromRedis } from "../redis/getSockets";

export const socketHandler = (socket: Socket, io: Server, userId: string) => {

  socket.on("chat", async (data: ChatMsg) => {
    const { message, recipient } = data;
    
    const recipientId = await getSocketsFromRedis(recipient);
    console.log(recipientId);

    if (typeof recipientId === "string") {
      socket.to(recipientId as string).emit("chat", {sender:'ummar',message});
    }
  });
};
 