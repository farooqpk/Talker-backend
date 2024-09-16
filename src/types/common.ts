import { Server, Socket } from "socket.io";
import { DecodedPayload } from "./DecodedPayload";

export type EncryptedChatKey = {
  encryptedChatKey: Array<{
    userId: string;
    encryptedKey: string;
  }>;
};

export enum ContentType {
  TEXT = "TEXT",
  AUDIO = "AUDIO",
  IMAGE = "IMAGE",
}

export type SocketHandlerParams = {
  socket: Socket;
  io: Server;
  payload: DecodedPayload;
};
