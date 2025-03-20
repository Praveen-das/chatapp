import SocketService from './ws'
import http from 'http'
import redisClient from './redis/client'
import { setupWorker } from '@socket.io/sticky';

const PORT = process.env.PORT || 3002;

(async () => {
    const httpServer = http.createServer();

    const socket = new SocketService(httpServer);

    socket.initAdapter(redisClient)

    socket.initListeners();
    
    socket.io.listen(Number(PORT))

    // setupWorker(socket.io);
})()
