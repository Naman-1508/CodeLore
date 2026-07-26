import express from 'express';
import cors from 'cors';
import { runParsingPipeline } from './pipeline';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/v1/parse', async (req, res) => {
  const { repositoryId, remoteUrl, workspaceId } = req.body;
  if (!repositoryId || !remoteUrl) {
    return res.status(400).json({ error: 'Missing repositoryId or remoteUrl' });
  }

  // Kick off the background pipeline
  runParsingPipeline(repositoryId, remoteUrl, workspaceId).catch(console.error);

  res.json({ status: 'started' });
});

const port = process.env.PORT || 4001;
app.listen(port, () => {
  console.log(`Parser Service listening on port ${port}`);
});
