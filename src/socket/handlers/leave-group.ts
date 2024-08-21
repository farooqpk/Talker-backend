import { SocketHandlerParams } from "../../types/common";

type LeaveGroup = {
  groupIds: string[];
};

export const leaveGroupHandler = (
  { socket }: SocketHandlerParams,
  { groupIds }: LeaveGroup
) => {
  groupIds?.forEach((id: string) => {
    socket.leave(id)
    console.log("leaveGroup", id);
  });
};
