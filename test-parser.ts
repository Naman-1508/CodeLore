import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '.env') });

async function test() {
  console.log('Testing Parser Pipeline directly...');
  const { createDbConnection, repositories } = require('@repo/database');
  const { runParsingPipeline } = require('./services/core-engine/parser-service/src/pipeline');
  
  const db = createDbConnection(process.env.DATABASE_URL!);
  
  let repo = await db.query.repositories.findFirst({
    where: (repos: any, { eq }: any) => eq(repos.name, 'ejs')
  });
  
  console.log(`Running pipeline on ${repo.name} (${repo.remoteUrl})`);
  await runParsingPipeline(repo.id, repo.remoteUrl, repo.workspaceId);
  console.log('Pipeline finished.');
  
  process.exit(0);
}

test().catch(console.error);
