# AI Service

Standalone microservice for processing AI assist requests using BullMQ workers and Google Gemini AI.

## Features

- **BullMQ Worker**: Processes AI assist jobs from Redis queue
- **Concurrency**: Handles 20 concurrent AI requests
- **Rate Limiting**: Max 100 requests per minute (respects API limits)
- **Bull Board Dashboard**: Monitor queue status at `/admin/queues`
- **Socket.IO Integration**: Sends responses via Redis Emitter

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Configure environment:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   ```env
   REDIS_HOST=localhost
   REDIS_PORT=6379
   PORT=4500
   GOOGLE_AI_API_KEY=your_actual_api_key
   ```

3. **Build:**
   ```bash
   npm run build
   ```

## Running

### Development

```bash
npm run dev
```

### Production

```bash
npm start
```

## Bull Board Dashboard

Access the queue monitoring dashboard at:

```
http://localhost:4500/admin/queues
```

Features:

- View active, waiting, completed, and failed jobs
- Retry failed jobs
- See job details and processing times
- Monitor queue health

## Architecture

```
Client Request → Backend API → Redis Queue
                                    ↓
                              AI Service Worker
                                    ↓
                            Google Gemini API
                                    ↓
                            Redis Emitter → Socket.IO → Client
```

## Scaling

Run multiple instances for higher throughput:

```bash
# Terminal 1
PORT=4500 npm start

# Terminal 2
PORT=4501 npm start

# Terminal 3
PORT=4502 npm start
```

All instances will process jobs from the same Redis queue.

## Environment Variables

| Variable            | Description    | Default     |
| ------------------- | -------------- | ----------- |
| `PORT`              | Service port   | `4500`      |
| `REDIS_HOST`        | Redis host     | `localhost` |
| `REDIS_PORT`        | Redis port     | `6379`      |
| `GOOGLE_AI_API_KEY` | Gemini API key | Required    |

## Health Check

```bash
curl http://localhost:4500/health
```

Response:

```json
{ "status": "ok", "service": "ai-service" }
```
