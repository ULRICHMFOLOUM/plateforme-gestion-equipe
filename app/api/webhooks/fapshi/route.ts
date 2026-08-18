import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateExpirationDate } from "@/lib/subscription";

/**
 * POST /api/webhooks/fapshi
 * Notification instantanée envoyée par Fapshi lorsqu'un paiement Mobile Money réussit.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("📥 Webhook Fapshi reçu:", body);

    const { transId, externalId, status, amount } = body;

    if (!externalId && !transId) {
      return NextResponse.json({ error: "Identifiant manquant" }, { status: 400 });
    }

    if (status !== "SUCCESSFUL" && status !== "SUCCESS") {
      return NextResponse.json({ message: "Ignoré : statut non payé" }, { status: 200 });
    }

    const payment = await prisma.payment.findFirst({
      where: {
        OR: [
          { id: externalId },
          { transactionId: transId },
        ],
      },
    });

    if (!payment) {
      console.warn("⚠️ Webhook Fapshi : Paiement non trouvé pour id:", externalId || transId);
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    }

    if (payment.status === "SUCCESS") {
      return NextResponse.json({ message: "Paiement déjà activé" }, { status: 200 });
    }

    const expirationDate = calculateExpirationDate(payment.billingPeriod);

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCESS",
          transactionId: transId || payment.transactionId,
          paidAt: new Date(),
        },
      }),
      prisma.user.update({
        where: { id: payment.userId },
        data: {
          plan: payment.plan,
          subscriptionStatus: "ACTIVE",
          subscriptionEndsAt: expirationDate,
        },
      }),
    ]);

    console.log(`🎉 [Webhook Fapshi] Abonnement activé avec succès pour userId ${payment.userId}`);
    return NextResponse.json({ success: true, message: "Abonnement activé" });
  } catch (error: any) {
    console.error("❌ Erreur traitement Webhook Fapshi:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
