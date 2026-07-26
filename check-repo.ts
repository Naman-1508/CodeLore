import * as dotenv from 'dotenv';
import { resolve } from 'path';
dotenv.config({ path: resolve(__dirname, '.env') });

import { createDbConnection } from './packages/database/src/index';
import * as schema from './packages/database/src/schema';

const dbUrl = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/codelore';
const db = createDbConnection(dbUrl);

async function check() {
  try {
    let ws = await db.query.workspaces.findFirst();
    if (!ws) {
      const [newWs] = await db.insert(schema.workspaces).values({
        name: 'Default Workspace',
        aiLayerEnabled: true
      }).returning();
      ws = newWs;
    }

    console.log("Using workspace:", ws.id);

    const remoteUrl = 'https://github.com/expressjs/express';
    const result = await db.insert(schema.repositories).values({
      remoteUrl,
      workspaceId: ws.id,
      name: 'express',
      indexingStatus: 'pending'
    }).returning();
    
    console.log("Inserted repo:", result[0]);
  } catch (e) {
    console.error("DB Error:", e);
  }
}
check();
