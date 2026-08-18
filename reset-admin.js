const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  const adminEmail = 'admin@teamflow.com';
  const newPassword = 'password123';
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  
  await prisma.user.update({
    where: { email: adminEmail },
    data: { password: hashedPassword }
  });
  console.log('Admin password reset to ' + newPassword);
}

main().finally(() => prisma.$disconnect());
