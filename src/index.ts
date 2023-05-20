import express, { Express, Request, Response } from "express";

const app: Express = express();

app.get("/", (req: Request, res: Response): void => {
  res.send("hello from server");
});

app.listen(3000, (): void => {
  console.log(`server listening @ http://localhost:3000/`);
});
