import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

/**
 * Configuration de NextAuth.js
 * Ce fichier définit comment les utilisateurs se connectent et comment leurs sessions sont gérées.
 */
export const authOptions: NextAuthOptions = {
  // L'adaptateur Prisma permet de lier NextAuth à notre base de données
  adapter: PrismaAdapter(prisma),
  
  // Configuration des fournisseurs d'authentification
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      /**
       * Fonction 'authorize' : C'est ici que l'on vérifie si l'utilisateur peut se connecter.
       */
      async authorize(credentials) {
        try {
          // Vérification de la présence des identifiants
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          // Recherche de l'utilisateur en base de données par son email
          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          // Si l'utilisateur n'existe pas ou n'a pas de mot de passe (ex: auth sociale)
          if (!user || !user.password) {
            return null;
          }

          // Comparaison sécurisée du mot de passe fourni avec le hash stocké en base
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            return null;
          }

          // Si tout est bon, on retourne l'objet utilisateur (qui sera stocké dans le JWT)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (e: any) {
          console.error("Erreur d'authentification:", e);
          return null;
        }
      },
    }),
  ],
  
  // Clé secrète pour signer les cookies de session
  secret: process.env.NEXTAUTH_SECRET || "plateforme-gestion-equipe-secret-dev-2026",
  
  // Stratégie de session : On utilise les JWT (JSON Web Tokens)
  session: {
    strategy: "jwt",
  },
  
  // Fonctions de rappel (Callbacks) pour enrichir le jeton et la session
  callbacks: {
    /**
     * Callback JWT : Appelé lors de la création ou mise à jour du jeton.
     */
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role; // On ajoute le rôle au jeton
      }
      // Permet de mettre à jour les données de session en direct via l'UI
      if (trigger === "update" && session) {
        return { ...token, ...session };
      }
      return token;
    },
    
    /**
     * Callback Session : Définit les données accessibles côté client (useSession).
     */
    async session({ session, token }) {
      try {
        if (token) {
          session.user.id = token.sub!;
          session.user.role = token.role as string;
          
          // Récupération des données fraîches depuis la base de données 
          // pour garantir que le profil affiché est toujours à jour.
          const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id }
          });
          
          if (dbUser) {
            session.user.name = dbUser.name;
            session.user.image = dbUser.image;
            (session.user as any).role = dbUser.role;
            (session.user as any).firstName = dbUser.firstName;
            (session.user as any).lastName = dbUser.lastName;
            (session.user as any).bio = dbUser.bio;
            (session.user as any).phone = dbUser.phone;
            (session.user as any).department = dbUser.department;
            (session.user as any).jobTitle = dbUser.jobTitle;
            (session.user as any).timezone = dbUser.timezone;
            (session.user as any).language = dbUser.language;
          }
        }
        return session;
      } catch (error: any) {
        console.error("Erreur de session:", error);
        return session;
      }
    },
  },
  
  // Pages personnalisées
  pages: {
    signIn: "/auth/signin", // Page de connexion personnalisée
  },
};
