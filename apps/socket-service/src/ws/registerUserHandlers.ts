import { Server } from "socket.io";
import { ISocket } from "../interfaces/socketInterfaces";
import { getConversations } from "../services/getConversations";

let blockedUsers: IUBlockReq[] = []

export default async function registerUserHandlers(io: Server, socket: ISocket) {
    
    try {
        const conversations = await getConversations(socket)
        
        socket.emit("conversations", { 
            ...conversations, 
            blockedUsers: blockedUsers.filter(u => u.userId === socket.userId) ,
            blockedByUsers: blockedUsers.filter(u => u.blockedId === socket.userId,) 
        });
        
    } catch (error) {
        console.log("🚀 ~ registerUserHandlers ~ error:", error)
    }

    socket.join(socket.userId!);

    const user = {
        socketId: socket.id,
        userId: socket.userId,
        username: socket.username,
        connected: true
    };

    socket.broadcast.emit("user connected", user);

    socket.on("REQUEST:BLOCK_USER", (req: IUBlockReq) => {
        blockedUsers.push(req)
        io.to(socket.userId!).to(req.blockedId).emit("RESPONSE:BLOCK_USER", req)
    })

    socket.on("REQUEST:UNBLOCK_USER", (req: IUBlockReq) => {
        blockedUsers = blockedUsers.filter(u => u.blockedId !== req.blockedId && u.userId !== req.userId)
        io.to(socket.userId!).to(req.blockedId).emit("RESPONSE:UNBLOCK_USER", req)
    })
}
