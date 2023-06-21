import { Request } from "express";


export interface ReqObjWithUserId extends Request {
    userId: string;
  }