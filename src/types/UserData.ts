import { Request } from "express";

export interface AccesTokenData {
    sub: string;
    picture: string;
    email: string;
  }

  export interface UserType {
    sub: string;
    name: string;
    email: string;
    picture: string;
  }

 export interface AuthenticatedRequest extends Request {
    userId: string;
  }