import express, { Express, Request, Response, urlencoded } from "express";
import cors from "cors";
import { router } from "./routes/route";
import dotenv from "dotenv";
dotenv.config();

const app: Express = express();

app.use(
  (cors as (options: cors.CorsOptions) => express.RequestHandler)({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: "GET,POST,PUT,DELETE",
  })
);
app.use(express.json());
app.use("/", router);
app.use(urlencoded({ extended: false }));

app.get("/", (req: Request, res: Response): void => {
  res.send("hello from server");
});

app.listen(3000, (): void => {
  console.log(`server listening @ http://localhost:3000/`);
});
