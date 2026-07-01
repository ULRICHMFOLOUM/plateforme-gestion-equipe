import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";

// Configuration du constructeur WebSocket pour l'environnement Node.js
if (typeof window === "undefined") {
  neonConfig.webSocketConstructor = ws;
}

/**
 * Ce fichier configure le client Prisma pour interagir avec la base de données PostgreSQL (Neon).
 * On utilise l'adaptateur WebSocket (PrismaNeon) pour supporter pleinement les transactions 
 * (nécessaires pour l'authentification et les contacts) tout en passant par le port sécurisé 443.
 */

// Déclaration d'une variable pour le singleton Prisma afin d'éviter de créer 
// plusieurs clients en mode développement.
let prisma: PrismaClient;

/**
 * Fonction pour initialiser le client Prisma avec l'adaptateur WebSocket de Neon.
 */
function getPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("ERREUR FATALE: La variable DATABASE_URL est absente du fichier .env");
  }
  
  // Initialisation de l'adaptateur WebSocket pour Neon
  const adapter = new PrismaNeon({ connectionString });
  
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
