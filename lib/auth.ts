import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import GithubProvider from "next-auth/providers/github";
import bcrypt from "bcryptjs";
import { totp } from "./totp";
import { prisma } from "./prisma";

/**
 * Configuration de NextAuth.js avec support Google, GitHub, 2FA TOTP & Sécurité Admin
 */
export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    // 1. Google OAuth
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),

    // 2. GitHub OAuth
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      allowDangerousEmailAccountLinking: true,
    }),

    // 3. Email + Mot de passe + 2FA
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        code: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            return null;
          }

          const user = await prisma.user.findUnique({
            where: { email: credentials.email },
          });

          console.log("Login attempt for:", credentials.email);
          console.log("User found:", !!user, "Has password:", !!user?.password);

          if (!user || !user.password) {
            return null;
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          console.log("Password valid:", isPasswordValid);

          if (!isPasswordValid) {
            return null;
          }

          const requires2FA = user.twoFactorEnabled || user.role === "ADMIN";

          if (requires2FA && user.twoFactorSecret) {
            const code = credentials.code;
            if (!code) {
              throw new Error("2FA_REQUIRED");
            }

            const isCodeValid = totp.verifyOTP(code, user.twoFactorSecret);
            if (!isCodeValid) {
              throw new Error("INVALID_2FA_CODE");
            }
          }

          // Mettre à jour lastLogin et initialiser l'essai si non encore fait
          await prisma.user.update({
            where: { id: user.id },
            data: {
              lastLogin: new Date(),
              // Si l'utilisateur n'a pas encore de date de fin d'essai, on la crée (J+14)
              ...(!user.trialEndsAt ? { trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) } : {}),
            },
          });

          console.log("Authentication successful for:", user.email);
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (e: any) {
          console.error("Erreur d'authentification complète:", e);
          if (e.message === "2FA_REQUIRED" || e.message === "INVALID_2FA_CODE") {
            throw new Error(e.message);
          }
          return null;
        }
      },
    }),
  ],

  secret: process.env.NEXTAUTH_SECRET || "plateforme-gestion-equipe-secret-dev-2026",

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.role = user.role;
      }
      if (trigger === "update" && session) {
        return { ...token, ...session };
      }
      return token;
    },

    async session({ session, token }) {
      try {
        if (token) {
          session.user.id = token.sub!;
          session.user.role = token.role as string;

          const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id }
          });

          if (dbUser) {
            session.user.name = dbUser.name;
            session.user.image = dbUser.image;
            (session.user as any).role = dbUser.role;
            (session.user as any).twoFactorEnabled = dbUser.twoFactorEnabled;
            (session.user as any).firstName = dbUser.firstName;
            (session.user as any).lastName = dbUser.lastName;
            (session.user as any).bio = dbUser.bio;
            (session.user as any).phone = dbUser.phone;
            (session.user as any).department = dbUser.department;
            (session.user as any).jobTitle = dbUser.jobTitle;
            (session.user as any).timezone = dbUser.timezone;
            (session.user as any).language = dbUser.language;
            // ── Infos d'abonnement ──
            (session.user as any).plan = dbUser.plan;
            (session.user as any).subscriptionStatus = dbUser.subscriptionStatus;
            (session.user as any).trialEndsAt = dbUser.trialEndsAt ? dbUser.trialEndsAt.toISOString() : null;
            (session.user as any).subscriptionEndsAt = dbUser.subscriptionEndsAt ? dbUser.subscriptionEndsAt.toISOString() : null;
            (session.user as any).isInternalAccount = dbUser.isInternalAccount;
          }
        }
        return session;
      } catch (error: any) {
        console.error("Erreur de session:", error);
        return session;
      }
    },
  },

  pages: {
    signIn: "/auth/signin",
  },
};
