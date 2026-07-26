import dotenv from 'dotenv';
dotenv.config();
import IORedis from 'ioredis';
import { Queue } from 'bullmq';

async function run() {
  const connection = new IORedis(process.env.REDIS_URL!, { tls: { rejectUnauthorized: false } });
  const queue = new Queue('parser-queue', { connection });
  const failed = await queue.getFailed();
  console.log('Failed jobs:', failed.length);
  for (const job of failed) {
    if (job.id === '8' || job.data?.remoteUrl?.includes('Consistency-Tracker')) {
      console.log('Retrying job', job.id);
      await job.retry();
    }
  }
  console.log('Done.');
  process.exit(0);
}
run();
