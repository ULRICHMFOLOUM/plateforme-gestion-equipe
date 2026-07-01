import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/**
 * API Route : Inscription d'un nouvel utilisateur (Sign up)
 * Méthode : POST
 */
export async function POST(request: NextRequest) {
  try {
    console.log("🔵 API Inscription appelée");
    const { name, email, password } = await request.json();

    // Journalisation sécurisée (on masque une partie des infos)
    console.log("📧 Données d'inscription reçues pour:", {
      name,
      email: email.substring(0, 3) + "***",
    });

    // 1. Validation du format de l'email via Expression Régulière (Regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ message: "Format d'email invalide" }, { status: 400 });
    }

    // 2. Vérification que tous les champs obligatoires sont présents
    if (!name || !email || !password) {
      return NextResponse.json(
        { message: "Tous les champs (nom, email, mot de passe) sont requis" },
        { status: 400 },
      );
    }

    // 3. Validation de la longueur du mot de passe pour la sécurité
    if (password.length < 6) {
      return NextResponse.json(
        { message: "Le mot de passe doit contenir au moins 6 caractères" },
        { status: 400 },
      );
    }

    // 4. Vérification de l'unicité : l'utilisateur existe-t-il déjà ?
    console.log("🔍 Vérification de l'existence de l'utilisateur:", email);
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log("❌ L'utilisateur existe déjà en base");
      return NextResponse.json(
        { message: "Un utilisateur avec cet email est déjà inscrit" },
        { status: 400 },
      );
    }

    // 5. Sécurité : Hachage du mot de passe
    // On utilise bcrypt avec un 'salt' de 12 pour rendre le décryptage impossible par force brute.
    console.log("🔐 Hachage du mot de passe en cours...");
    const hashedPassword = await bcrypt.hash(password, 12);

    // 6. Insertion dans la base de données via Prisma
    console.log("✨ Création du compte dans la base de données...");
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword, // On stocke le hash, JAMAIS le mot de passe en clair.
      },
      // On sélectionne uniquement les champs non sensibles à retourner au client
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    console.log("✅ Inscription réussie pour l'ID:", user.id);
    return NextResponse.json(
      {
        message: "Compte créé avec succès. Vous pouvez maintenant vous connecter.",
        user,
      },
      { status: 201 },
    );
  } catch (error: any) {
    // Gestion centralisée des erreurs (Prisma ou autres)
    console.error("💥 ERREUR LORS DE L'INSCRIPTION:", error);
    return NextResponse.json(
      {
        message: "Une erreur est survenue lors de l'inscription.",
        error: error.message,
        code: error.code, // Code d'erreur Prisma (utile pour le débogage)
      },
      { status: 500 },
    );
  }
}
