const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.resolve(__dirname, '.env') });
const { createDbConnection, repositories, workspaces } = require('@repo/database');

async function test() {
  try {
    const db = createDbConnection(process.env.DATABASE_URL);
    let ws = await db.query.workspaces.findFirst();
    if (!ws) {
      console.log('No workspace found');
      return;
    }
    console.log('Inserting repo for workspace', ws.id);
    const result = await db.insert(repositories).values({
      remoteUrl: 'https://github.com/expressjs/express',
      workspaceId: ws.id,
      name: 'express',
      indexingStatus: 'pending'
    }).returning();
    console.log('Inserted repo:', result);
  } catch (err) {
    console.error('DB Error:', err);
  }
}

test();
