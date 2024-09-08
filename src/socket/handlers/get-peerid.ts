import { SocketEvents } from "../../events";
import { getDataFromRedis } from "../../redis";
import { SocketHandlerParams } from "../../types/common";

type PeerIdHandler = {
  recipientId: string;
};

export const getRecipientPeerIdHandler = async (
  { io, payload, socket }: SocketHandlerParams,
  { recipientId }: PeerIdHandler
) => {
  const peerid = await getDataFromRedis(`peer:${recipientId}`, true);
  socket.emit(SocketEvents.GET_RECIPIENT_PEER_ID, peerid);
};
