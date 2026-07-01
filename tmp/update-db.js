const { neon } = require('@neondatabase/serverless');

async function main() {
  const sql = neon("postgresql://neondb_owner:npg_PSaRdiqe1bx2@ep-muddy-star-amqmyxrc.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require");
  
  try {
    console.log("Adding accessCode column to Project table...");
    await sql`ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "accessCode" TEXT;`;
    console.log("Adding unique index to accessCode...");
    // Try catch for index as it might already exist if semi-pushed
    try {
      await sql`CREATE UNIQUE INDEX "Project_accessCode_key" ON "Project"("accessCode");`;
    } catch (e) {
      console.log("Index might already exist, skipping...");
    }
    console.log("Database updated successfully!");
  } catch (err) {
    console.error("Error updating database:", err);
  }
}

main();
