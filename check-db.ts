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
    console.log("Workspace:", ws);
  } catch (e) {
    console.error("DB Error:", e);
  }
}
check();
