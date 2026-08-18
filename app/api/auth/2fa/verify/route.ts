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
    if (!code || code.length !== 6) {
      return NextResponse.json({ message: "Code à 6 chiffres requis" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || !user.twoFactorSecret) {
      return NextResponse.json({ message: "2FA non configurée" }, { status: 400 });
    }

    const isValid = totp.verifyOTP(code, user.twoFactorSecret);
    if (!isValid) {
      return NextResponse.json({ message: "Code 2FA invalide" }, { status: 400 });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        twoFactorEnabled: true,
        twoFactorConfirmedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Double authentification activée avec succès !",
      twoFactorEnabled: true,
    });
  } catch (error: any) {
    console.error("2FA Verify Error:", error);
    return NextResponse.json({ message: "Erreur lors de la vérification 2FA" }, { status: 500 });
  }
}
