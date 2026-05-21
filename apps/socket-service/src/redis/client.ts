import Redis from 'ioredis'

if (!process.env.REDIS_SERVICE_URI) {
  throw new Error("REDIS_SERVICE_URI is not defined")
}

const client = new Redis(process.env.REDIS_SERVICE_URI);

client.on('error', err => {
  console.log('Redis subClient Error', err)
  client.disconnect()
  console.log('Client disconnected')
});

export default client