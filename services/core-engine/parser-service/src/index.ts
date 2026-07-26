import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import express from 'express';
import cors from 'cors';
import { runParsingPipeline } from './pipeline';
import { PostgresQueueWorker } from './queue-worker';

const app = express();
app.use(cors());
app.use(express.json());

// Initialize BullMQ Worker
const worker = new PostgresQueueWorker();
worker.startPolling();

app.post('/v1/parse', async (req, res) => {
  const { repositoryId, remoteUrl, workspaceId } = req.body;
  if (!repositoryId || !remoteUrl) {
    return res.status(400).json({ error: 'Missing repositoryId or remoteUrl' });
  }

  // Kick off the background pipeline manually
  runParsingPipeline(repositoryId, remoteUrl, workspaceId).catch(console.error);

  res.json({ status: 'started' });
});

const port = process.env.PORT || 4001;
app.listen(port, () => {
  console.log(`Parser Service listening on port ${port}`);
});
