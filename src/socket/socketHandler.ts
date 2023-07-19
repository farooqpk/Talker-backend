import { Server, Socket } from "socket.io";

export const socketHandler=(socket:Socket,io:Server,userId:string)=>{  
    console.log(`socketId: ${socket.id},userId: ${userId}`);
    socket.on("chat",(data)=>{
       socket.emit(data)
    })
}