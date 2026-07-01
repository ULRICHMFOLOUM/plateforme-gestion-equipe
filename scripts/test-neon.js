const { neon } = require('@neondatabase/serverless');

const sql = neon(process.env.DATABASE_URL);

async function testConnection() {
  try {
    console.log('Testing connection with @neondatabase/serverless...');
    const result = await sql`SELECT 1 as result`;
    console.log('Connection successful:', result);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();
