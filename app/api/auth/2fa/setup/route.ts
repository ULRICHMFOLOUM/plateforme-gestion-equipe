import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { totp } from "@/lib/totp";
import QRCode from "qrcode";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Non autorisé" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "Utilisateur non trouvé" }, { status: 404 });
    }

    const secret = totp.generateSecret();
    const serviceName = "TeamFlow";
    const otpauth = totp.keyuri(user.email, serviceName, secret);

    const qrCodeUrl = await QRCode.toDataURL(otpauth);

    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret },
    });

    return NextResponse.json({
      secret,
      qrCodeUrl,
      otpauth,
    });
  } catch (error: any) {
    console.error("2FA Setup Error:", error);
    return NextResponse.json({ message: "Erreur lors de la configuration 2FA" }, { status: 500 });
  }
}
