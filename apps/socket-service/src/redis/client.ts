import Redis from 'ioredis'

const redisConfig = {
    host: "redis-e7e3656-artworld.a.aivencloud.com",
    port: 17595,
    username: 'default',
    password: 'AVNS_Tdx5-ahhIXg-wizQLSd',
}

const client = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  });

client.on('error', err => {
    console.log('Redis subClient Error', err)
    client.disconnect()
    console.log('Client disconnected')
});

export default client