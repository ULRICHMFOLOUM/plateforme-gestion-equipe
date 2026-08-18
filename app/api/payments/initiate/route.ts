import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const FAPSHI_API_USER = process.env.FAPSHI_API_USER || "";
const FAPSHI_API_KEY = process.env.FAPSHI_API_KEY || "";
const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

const PLAN_AMOUNTS = {
  PRO_MONTHLY: 10000,
  PRO_YEARLY: 100000,
  ENTERPRISE_MONTHLY: 50000,
  ENTERPRISE_YEARLY: 500000,
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { plan, billingPeriod } = await req.json();

    if (!["PRO", "ENTERPRISE"].includes(plan) || !["MONTHLY", "YEARLY"].includes(billingPeriod)) {
      return NextResponse.json({ error: "Plan ou période invalide" }, { status: 400 });
    }

    const key = `${plan}_${billingPeriod}` as keyof typeof PLAN_AMOUNTS;
    const amount = PLAN_AMOUNTS[key];

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true, phone: true },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    // Créer un paiement en attente en base
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        amount,
        currency: "XAF",
        status: "PENDING",
        plan: plan as any,
        billingPeriod: billingPeriod as any,
      },
    });

    // Appel API Fapshi pour générer le lien de paiement Mobile Money / Carte
    const fapshiResponse = await fetch("https://live.fapshi.com/initiate-pay", {
      method: "POST",
      headers: {
        apiuser: FAPSHI_API_USER,
        apikey: FAPSHI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        email: user.email,
        userId: session.user.id,
        externalId: payment.id,
        redirectUrl: `${BASE_URL}/settings/billing?payment=success&tx_ref=${payment.id}`,
        message: `TeamFlow Abonnement Plan ${plan} (${billingPeriod === "MONTHLY" ? "Mensuel" : "Annuel"})`,
      }),
    });

    const fapshiData = await fapshiResponse.json();

    if (!fapshiResponse.ok || !fapshiData.link) {
      console.error("Erreur réponse Fapshi:", fapshiData);
      return NextResponse.json(
        { error: "Erreur Fapshi : " + (fapshiData.message || fapshiData.error || "Impossible de générer le paiement") },
        { status: 500 }
      );
    }

    // Sauvegarder le transId Fapshi
    if (fapshiData.transId) {
      await prisma.payment.update({
        where: { id: payment.id },
        data: { transactionId: fapshiData.transId },
      });
    }

    return NextResponse.json({ paymentLink: fapshiData.link, paymentId: payment.id });
  } catch (error: any) {
    console.error("Erreur initiation paiement Fapshi:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
