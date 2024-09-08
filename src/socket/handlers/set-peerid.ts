import { clearFromRedis, getDataFromRedis, setDataInRedis } from "../../redis";
import { SocketHandlerParams } from "../../types/common";

export const setPeerIdHandler = async (
  { io, payload }: SocketHandlerParams,
  peerId: string | null
) => {
  if (!peerId) {
    await clearFromRedis({
      key: `peer:${payload.userId}`,
    });
  } else {
    await setDataInRedis({
      key: `peer:${payload.userId}`,
      data: peerId,
      isString: true,
    });
    console.log(`Peer ID set for user ${payload.username}: ${peerId}`);
  }
};
