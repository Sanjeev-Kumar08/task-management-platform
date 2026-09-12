import http from 'node:http';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { connectMongo } from './db/mongo.js';
import { getRedis } from './db/redis.js';
import { initSocket } from './sockets/io.js';
import { setSocketServer, startWorkers } from './jobs/queues.js';

async function main() {
  await connectMongo();
  getRedis();

  const app = createApp();
  const server = http.createServer(app);
  const io = initSocket(server);
  setSocketServer(io);
  startWorkers();

  server.listen(env.PORT, () => {
    logger.info(`WorkSpace API listening on port ${env.PORT}`);
    logger.info(`Swagger docs at http://localhost:${env.PORT}/api/docs`);
  });
}

main().catch((err) => {
  logger.error({ err }, 'Failed to start server');
  process.exit(1);
});
