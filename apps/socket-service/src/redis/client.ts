import Redis from 'ioredis'

const client = new Redis(process.env.REDIS_SERVICE_URI!);

client.on('error', err => {
  console.log('Redis subClient Error', err)
  client.disconnect()
  console.log('Client disconnected')
});

export default client