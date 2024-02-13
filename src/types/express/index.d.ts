declare namespace Express {
    interface Request {
      // add arbitrary keys to the request
      [userId: string]: any;
      [username: string]: any;
    }
  }