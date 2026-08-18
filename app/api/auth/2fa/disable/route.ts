import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { totp } from "@/lib/totp";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const { code } = await req.json();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
    }

    if (user.role === "ADMIN") {
      return NextResponse.json({ message: "La 2FA est obligatoire pour les administrateurs" }, { status: 403 });
    }

    if (user.twoFactorSecret && code) {
      const isValid = totp.verifyOTP(code, user.twoFactorSecret);
      if (!isValid) {
        return NextResponse.json({ message: "Code 2FA invalide" }, { status: 400 });
      }
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
        twoFactorConfirmedAt: null,
      },
    });

    return NextResponse.json({ message: "2FA désactivée avec succès", twoFactorEnabled: false });
  } catch (error: any) {
    console.error("2FA Disable Error:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
