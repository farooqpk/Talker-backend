import express, { Express, Request, Response, urlencoded } from "express";
import {router} from './routes/route'
import cors from 'cors'

const app: Express = express();

app.use("/",router)
app.use(cors())
app.use(express.json())
app.use(urlencoded({extended:false}))


app.get("/", (req: Request, res: Response): void => {
  res.send("hello from server");
});


app.listen(3000, (): void => {
  console.log(`server listening @ http://localhost:3000/`);
});
