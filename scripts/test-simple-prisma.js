const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({ log: ['query', 'info', 'warn', 'error'] });

async function main() {
  try {
    console.log("Testing connection...");
    // Essayer de compter les utilisateurs
    const count = await prisma.user.count();
    console.log(`Connection successful. User count: ${count}`);
  } catch (error) {
    console.error("Connection failed:");
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
