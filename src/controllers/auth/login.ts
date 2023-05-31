import { Request, Response } from "express";

export const login = (req: Request, res: Response) => {
  console.log("hello from login");
  res.json(true)
};
