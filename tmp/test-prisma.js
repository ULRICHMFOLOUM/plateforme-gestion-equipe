require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count()
  .then(cnt => console.log('✅ PRISMA NATIVE TCP SUCCESS - User count:', cnt))
  .catch(e => console.error('❌ PRISMA NATIVE TCP ERROR:', e.message))
  .finally(() => prisma.$disconnect());
