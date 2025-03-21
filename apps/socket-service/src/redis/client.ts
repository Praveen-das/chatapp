import Redis from 'ioredis'

const client = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
  });

client.on('error', err => {
    console.log('Redis subClient Error', err)
    client.disconnect()
    console.log('Client disconnected')
});

export default client