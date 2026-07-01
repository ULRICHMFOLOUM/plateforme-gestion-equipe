const { neon } = require('@neondatabase/serverless');

const connectionString = "postgresql://neondb_owner:npg_PSaRdiqe1bx2@ep-muddy-star-amqmyxrc.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";
const sql = neon(connectionString);

async function testConnection() {
  try {
    console.log('Testing connection with @neondatabase/serverless (hardcoded URL)...');
    const result = await sql`SELECT 1 as result`;
    console.log('Connection successful:', result);
  } catch (error) {
    console.error('Connection failed:', error);
  }
}

testConnection();
