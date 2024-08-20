import { Server } from "socket.io"
import Redis from 'ioredis'
import socketSessionMiddleware from "../middleware/socketSessionMiddleware"
import { createAdapter } from '@socket.io/redis-adapter'
import { IHttpServer, ISocketService } from "../interfaces/socketInterfaces"
import config from "../config"

import { onConnection } from "./registerConnectionHandler"

class SocketService implements ISocketService {
    #_io
    #server
    #opts = {
        cors: config.cors,
        // maxHttpBufferSize: 1e8
    }

    constructor(server: IHttpServer) {
        console.log('Socket Service runnning...')
        this.#server = server
        this.#_io = new Server(this.#server, this.#opts);
    }

    get io() {
        return this.#_io;
    }

    initAdapter(client: Redis) {
        const pub = client
        const sub = client.duplicate()

        pub.on('error', err => {
            console.log('Redis pubClient Error', err)
            // pub.disconnect()
            console.log('Client disconnected')
        });

        sub.on('error', err => {
            console.log('Redis subClient Error', err)
            // sub.disconnect()
            console.log('Client disconnected')
        });

        const adapter = createAdapter(pub, sub)
        this.io.adapter(adapter)
    }

    initListeners() {
        console.log('Socket Listener initailized...')

        const io = this.io;

        io.use(socketSessionMiddleware)

        io.on('connection', (socket) => onConnection(io, socket))
    }
}

export default SocketService