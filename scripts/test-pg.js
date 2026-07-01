const { Client } = require('pg');

async function testConnection(url, name) {
  const client = new Client({ connectionString: url });
  try {
    console.log(`Testing ${name}...`);
    await client.connect();
    const res = await client.query('SELECT NOW()');
    console.log(`Success ${name}:`, res.rows[0]);
    return true;
  } catch (err) {
    console.error(`Failed ${name}:`, err.message);
    return false;
  } finally {
    await client.end().catch(() => {});
  }
}

async function main() {
  const url1 = "postgresql://neondb_owner:npg_PSaRdiqe1bx2@ep-muddy-star-amqmyxrc.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";
  const url2 = "postgresql://neondb_owner:npg_PSaRdiqe1bx2@ep-muddy-star-amqmyxrc-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true";
  
  await testConnection(url1, "Direct URL");
  console.log("-------------------");
  await testConnection(url2, "Pooler URL");
}

main();
