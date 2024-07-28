import { Server } from "socket.io";
import { ISocket } from "../interfaces/socketInterfaces";
import { getConversations } from "../services/getConversations";
import produceMessage from "../kafka/kafka";
import sessionStore from "../session";

let blockedUsers: IUBlockReq[] = []

export default async function registerUserHandlers(io: Server, socket: ISocket) {

    try {
        const conversations = await getConversations(socket)

        socket.emit("conversations", {
            ...conversations,
            blockedUsers: blockedUsers.filter(u => u.userId === socket.userId),
            blockedByUsers: blockedUsers.filter(u => u.blockedId === socket.userId,)
        });

    } catch (error) {
        console.log("🚀 ~ registerUserHandlers ~ error:", error)
    }

    socket.join(socket.userId!);

    io.emit("user connected", { userId: socket.userId });

    produceMessage({ id: socket.userId, updates: { status: 'online', lastSeen: Date.now() } }, 'UPDATE_USER')

    socket.on("REQUEST:BLOCK_USER", (req: IUBlockReq) => {
        blockedUsers.push(req)
        io.to([socket.userId!, req.blockedId]).emit("RESPONSE:BLOCK_USER", req)
    })

    socket.on("REQUEST:UNBLOCK_USER", (req: IUBlockReq) => {
        blockedUsers = blockedUsers.filter(u => u.blockedId !== req.blockedId && u.userId !== req.userId)
        io.to(socket.userId!).to(req.blockedId).emit("RESPONSE:UNBLOCK_USER", req)
    })

    socket.on("updateUserRule", (req: IUserRuleChangeRequest) => {
        let key = Object.keys(req.rules)[0]

        let value = req.rules[key as keyof typeof req.rules].isVisible

        const body = { id: req.userId, updates: { [`rules.${key}.isVisible`]: value } }

        io.emit("updateUserRule", req);

        produceMessage(body, 'UPDATE_USER');
    })
}

