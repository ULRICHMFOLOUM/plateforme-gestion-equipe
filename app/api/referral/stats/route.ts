import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const userId = session.user.id;
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, referralCode: true, referralBalance: true },
    });

    if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

    // Generate referral code if user doesn't have one yet
    if (!user.referralCode) {
      const code = `TF-${(user.name || "USER").substring(0, 4).toUpperCase()}${Math.floor(1000 + Math.random() * 9000)}`;
      user = await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
        select: { id: true, name: true, email: true, referralCode: true, referralBalance: true },
      });
    }

    // Get referrals list
    const referrals = await prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referred: { select: { name: true, email: true, createdAt: true, plan: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const totalReferrals = referrals.length;
    const convertedReferrals = referrals.filter((r) => r.status === "CONVERTED" || r.status === "REWARDED").length;
    const totalEarned = referrals.reduce((sum, r) => sum + (r.rewardAmount || 0), 0);

    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const shareLink = `${baseUrl}/register?ref=${user.referralCode}`;

    return NextResponse.json({
      referralCode: user.referralCode,
      shareLink,
      referralBalance: user.referralBalance || 0,
      totalReferrals,
      convertedReferrals,
      totalEarned,
      referrals: referrals.map((r) => ({
        id: r.id,
        name: r.referred.name || r.referred.email.split("@")[0],
        emailMasked: r.referred.email.replace(/(.{2})(.*)(?=@)/, "$1***"),
        plan: r.referred.plan,
        status: r.status,
        rewardAmount: r.rewardAmount,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Erreur stats parrainage:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
