import SocketService from './ws'
import http from 'http'
import redisClient from './redis/client'
import { setupWorker } from '@socket.io/sticky';

(async () => {
    const httpServer = http.createServer();

    const socket = new SocketService(httpServer);

    socket.initAdapter(redisClient)

    socket.initListeners();
    
    socket.io.listen(3002)

    // setupWorker(socket.io);
})()
