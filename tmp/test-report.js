
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
  try {
    const projectId = "cmniwuzz00002ta74g7o7yi6y"; // Or any dummy
    console.log('Testing project queries...');
    
    console.log('Fetching project...');
    await prisma.project.findUnique({
        where: { id: projectId },
    });
    
    console.log('Fetching task count...');
    await prisma.task.count({ where: { projectId } });
    
    console.log('Fetching member count...');
    await prisma.groupMember.count({ where: { projectId } });
    
    console.log('Fetching file count...');
    await prisma.file.count({ where: { projectId } });

    console.log('All queries succeeded!');
  } catch (e) {
    console.error('Prisma Error:', e.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
