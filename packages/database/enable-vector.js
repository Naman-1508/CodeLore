const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log('Enabling pgvector extension...');
  try {
    await pool.query('CREATE EXTENSION IF NOT EXISTS vector;');
    console.log('Successfully enabled pgvector extension');
  } catch (err) {
    console.error('Error enabling pgvector extension:', err);
  } finally {
    await pool.end();
  }
}

main();
