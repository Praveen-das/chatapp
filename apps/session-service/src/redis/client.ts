import Redis from 'ioredis'

const client = new Redis()

client.on('error', err => {
    console.log('Redis session client Error', err)
    client.disconnect()
    console.log('Client disconnected')
});

export default client