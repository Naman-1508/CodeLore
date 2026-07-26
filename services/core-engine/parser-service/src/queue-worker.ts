import { Worker, Job } from 'bullmq';
import IORedis from 'ioredis';
import { runParsingPipeline } from './pipeline';

export class PostgresQueueWorker {
  private worker: Worker;

  constructor() {
    console.log('[QueueWorker] Initializing BullMQ Worker...');
    
    const redisConnection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
      tls: process.env.REDIS_URL?.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined
    });

    this.worker = new Worker('parser-queue', async (job: Job) => {
      console.log(`[QueueWorker] Processing job ${job.id} of type ${job.name}`);
      if (job.name === 'parse-repo') {
        const { repositoryId, remoteUrl, workspaceId } = job.data;
        await runParsingPipeline(repositoryId, remoteUrl, workspaceId);
      }
    }, { connection: redisConnection });

    this.worker.on('completed', (job) => {
      console.log(`[QueueWorker] Job ${job.id} has completed!`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[QueueWorker] Job ${job?.id} has failed with ${err.message}`);
    });
  }

  startPolling() {
    console.log('[QueueWorker] Worker is listening for jobs...');
  }

  stopPolling() {
    this.worker.close();
  }
}
