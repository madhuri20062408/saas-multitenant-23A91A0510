const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

pool.on('error', (err) => {
  console.error('Unexpected PG pool error', err);
});

async function query(text, params) {
  const res = await pool.query(text, params);
  return res;
}

module.exports = {
  pool,
  query,
};
