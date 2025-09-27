import { Server } from "socket.io";
import { ISocket } from "../interfaces/socketInterfaces";

export default function registerSessionHandler(io:Server,socket: ISocket) {
  socket.on('SAVE_SESSION',(sessionId:string)=>{
    io.to(socket.userId!).emit('SAVE_SESSION',sessionId)
  })

  socket.on('END_SESSION',(sessionId:string)=>{
    io.to(socket.userId!).emit('END_SESSION',sessionId)
  })
}
