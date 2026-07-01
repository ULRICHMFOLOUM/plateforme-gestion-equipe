import { PrismaClient } from "@prisma/client";
import { neon } from "@neondatabase/serverless";
import { PrismaNeonHttp } from "@prisma/adapter-neon";

/**
 * Ce fichier configure le client Prisma pour interagir avec la base de données PostgreSQL (Neon).
 * On utilise un adaptateur HTTP (PrismaNeonHttp) pour garantir la stabilité de la connexion
 * dans les environnements où les ports TCP standards (5432) sont bloqués.
 */

// Déclaration d'une variable pour le singleton Prisma afin d'éviter de créer 
// plusieurs clients en mode développement.
let prisma: PrismaClient;

/**
 * Fonction pour initialiser le client Prisma avec l'adaptateur HTTP de Neon.
 */
function getPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("ERREUR FATALE: La variable DATABASE_URL est absente du fichier .env");
  }
  
  // Initialisation de l'adaptateur HTTP pour Neon
  // Cela permet de passer par le port 80/443 au lieu du 5432.
  const adapter = new PrismaNeonHttp(connectionString as any, {} as any);
  
  return new PrismaClient({ 
    adapter, 
    log: ["query"] // Affiche les requêtes SQL dans la console (utile pour le débogage)
  });
}

// Gestion du singleton Prisma selon l'environnement (Production vs Développement)
if (process.env.NODE_ENV === "production") {
  prisma = getPrismaClient();
} else {
  // En développement, on attache le client à l'objet global pour le conserver
  // malgré les rechargements à chaud (Hot Module Reload) de Next.js.
  if (!global.prisma) {
    global.prisma = getPrismaClient();
  }
  prisma = global.prisma;
}

export { prisma };
