import { z } from "zod";

export const signupSchema = z.object({
  username: z.string().min(3).max(15),
  password: z.string().min(6),
  publicKey: z.string(),
});

export const loginSchema = z.object({
  username: z.string().min(3).max(15),
  password: z.string().min(6),
});

export const updateUsernameSchema = z.object({
  username: z.string().min(3).max(15),
});
