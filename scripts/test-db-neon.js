const { PrismaClient } = require('@prisma/client');
const { Pool, neonConfig } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');
const ws = require('ws');

// Configure WebSockets
neonConfig.webSocketConstructor = ws;

async function main() {
  const connectionString = "postgresql://neondb_owner:npg_PSaRdiqe1bx2@ep-muddy-star-amqmyxrc.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require";
  
  console.log('Testing connection with Prisma + Neon Adapter...');
  const poolObj = new Pool({ connectionString });

  const adapter = new PrismaNeon(poolObj);
  const prisma = new PrismaClient({ adapter });

  try {
    const result = await prisma.$queryRaw`SELECT 1 as result`;
    console.log('Connection successful:', result);
  } catch (error) {
    console.error('Connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
