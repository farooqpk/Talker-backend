import { SocketHandlerParams } from "../../types/common";
import msgpack from "msgpack-lite";

type LeaveGroup = {
  groupIds: string[];
};

export const leaveGroupHandler = (
  { socket }: SocketHandlerParams,
  data: Buffer
) => {
  const { groupIds } = msgpack.decode(data) as LeaveGroup;
  groupIds?.forEach((id: string) => {
    socket.leave(id);
    console.log("leaveGroup", id);
  });
};
