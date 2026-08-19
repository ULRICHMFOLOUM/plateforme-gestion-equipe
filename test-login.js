const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@teamflows.com';
  const newPassword = 'password123';
  
  const user = await prisma.user.findUnique({
    where: { email: adminEmail }
  });
  console.log("User found:", !!user);
  if (user) {
    const isMatch = await bcrypt.compare(newPassword, user.password);
    console.log("Password valid:", isMatch);
  }
}

main().finally(() => prisma.$disconnect());
