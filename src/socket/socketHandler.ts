import { Server, Socket } from "socket.io";
import { ChatMsg } from "../types/ChatMsgType";
import { getSocketsFromRedis } from "../redis/getSockets";
import { DecodedPayload } from "../types/DecodedPayload";
import { ChatModel } from "../models/chat/ChatMsg";

export const socketHandler = (
  socket: Socket,
  io: Server,
  decodedPayload: DecodedPayload
) => {
  console.log(`my username is ${decodedPayload.username}`);

  socket.on("chat", async (data: ChatMsg) => {
    const { message, recipient } = data;

    const recipientId = await getSocketsFromRedis(recipient);

    if (typeof recipientId === "string") {
      socket
        .to(recipientId as string)
        .emit("chat", { sender: decodedPayload.username, message });

      await ChatModel.updateOne(
        {
          $or: [
            { users: [decodedPayload.userId, recipient] },
            { users: [recipient, decodedPayload.userId] },
          ],
        },
        {
          $push: {
            messages: {
              senderId: decodedPayload.userId,
              recipientId: recipient,
              textMsg: message,
            },
          },
          users: [decodedPayload.userId, recipient],
        },
        { upsert: true }
      );
    } else {
      socket.emit("offline", "now recipient is offline");
    }
  });
};
