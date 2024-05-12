import { z } from "zod";

export const createGroupSchema = z.object({
  groupName: z.string().min(3).max(15),
  description: z.string(),
  encryptedChatKey: z.array(z.string()).min(3).max(10).nonempty(),
});
