import { createDbConnection, workspaces, users } from '@repo/database';
import dotenv from 'dotenv';
dotenv.config();

const db = createDbConnection(process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/codelore');

async function seed() {
  console.log('Seeding...');
  const [workspace] = await db.insert(workspaces).values({
    name: 'Default Workspace',
    aiLayerEnabled: true
  }).returning();
  
  console.log(`Created workspace: ${workspace.id}`);
  process.exit(0);
}
seed().catch(console.error);
