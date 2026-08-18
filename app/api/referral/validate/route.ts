import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { code, amount } = await request.json();

    if (!code) {
      return NextResponse.json({ error: "Code requis" }, { status: 400 });
    }

    const referrer = await prisma.user.findUnique({
      where: { referralCode: code.toUpperCase().trim() },
      select: { id: true, name: true },
    });

    if (!referrer) {
      return NextResponse.json({ valid: false, error: "Code de parrainage invalide" }, { status: 404 });
    }

    const discountPercentage = 15; // 15% discount for referred users
    const numericAmount = Number(amount) || 0;
    const discountAmount = Math.round((numericAmount * discountPercentage) / 100);
    const finalAmount = Math.max(0, numericAmount - discountAmount);

    return NextResponse.json({
      valid: true,
      code: code.toUpperCase().trim(),
      referrerName: referrer.name || "Parrain TeamFlow",
      discountPercentage,
      discountAmount,
      finalAmount,
      message: `Code valide ! Vous bénéficiez de 15% de réduction.`,
    });
  } catch (error) {
    console.error("Erreur validation parrainage:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
