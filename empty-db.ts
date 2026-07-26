import dotenv from 'dotenv';
dotenv.config();
import { createDbConnection, files, functions, classes, codeStories, codeStorySteps, callEdges, healthSnapshots, architectureSnapshots, repositories } from '@repo/database';

async function run() {
  const db = createDbConnection(process.env.DATABASE_URL!);
  await db.delete(codeStorySteps);
  await db.delete(codeStories);
  await db.delete(callEdges);
  await db.delete(functions);
  await db.delete(classes);
  await db.delete(files);
  await db.delete(healthSnapshots);
  await db.delete(architectureSnapshots);
  await db.delete(repositories);
  console.log('Database wiped');
  process.exit(0);
}
run();
