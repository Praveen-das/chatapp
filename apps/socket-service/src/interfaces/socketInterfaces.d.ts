import { Server } from 'http';
import { Redis } from 'ioredis';
import { Socket, Server as SocketServer } from 'socket.io';

type IHttpServer = Server | undefined
type ISocketServer = SocketServer

interface ISocketService {
    io: SocketServer
    server: IHttpServer | undefined

    initAdapter(client: Redis)
    initListeners()
}

interface ISocket extends Socket {
    user?: {
        id: string
        username: string
    }
    sessionId?: string
    userId?: string
    username?: string
}

