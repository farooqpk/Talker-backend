import { SOCKET } from "../../utils/configureSocketIO";

export const leaveGroupHandler = ({ groupIds }: { groupIds: string[] }) => {
  groupIds?.forEach((id: string) => {
    SOCKET.leave(id);
    console.log("leaveGroup", id);
  });
};
