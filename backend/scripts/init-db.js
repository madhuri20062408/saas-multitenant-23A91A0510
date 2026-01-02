const fs = require('fs');
const path = require('path');
require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  try {
    console.log('Applying schema...');
    await pool.query(sql);
    console.log('Schema applied.');
  } catch (err) {
    console.error('Error applying schema:', err);
  } finally {
    await pool.end();
  }
}

main();
