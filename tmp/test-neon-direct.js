const { neonConfig, Pool } = require('@neondatabase/serverless');
const ws = require('ws');
require('dotenv').config();
neonConfig.webSocketConstructor = ws;

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
console.log('Using URL:', url ? url.substring(0, 60) + '...' : 'UNDEFINED');

const pool = new Pool({ connectionString: url });
pool.query('SELECT COUNT(*) as cnt FROM "User"')
  .then(r => console.log('SUCCESS - Users in DB:', r.rows[0].cnt))
  .catch(e => console.error('ERROR:', e.message))
  .finally(() => pool.end());
