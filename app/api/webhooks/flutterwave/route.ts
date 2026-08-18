import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { calculateExpirationDate } from "@/lib/subscription";

const FLW_SECRET_HASH = process.env.FLW_SECRET_HASH || "";

export async function POST(req: NextRequest) {
  try {
    // Vérification de la signature Flutterwave
    const signature = req.headers.get("verif-hash");
    if (FLW_SECRET_HASH && signature !== FLW_SECRET_HASH) {
      console.warn("Webhook Flutterwave - Signature invalide");
      return NextResponse.json({ error: "Signature invalide" }, { status: 401 });
    }

    const body = await req.json();
    console.log("Webhook Flutterwave reçu:", JSON.stringify(body, null, 2));

    const { event, data } = body;

    // On traite seulement les paiements réussis
    if (event !== "charge.completed" || data.status !== "successful") {
      return NextResponse.json({ received: true });
    }

    const paymentId = data.tx_ref;
    const flwRef = data.flw_ref;
    const transactionId = String(data.id);

    // Vérifier le paiement en base
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { user: true },
    });

    if (!payment) {
      console.error("Paiement introuvable:", paymentId);
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    }

    // Éviter de traiter deux fois le même paiement
    if (payment.status === "SUCCESS") {
      return NextResponse.json({ received: true, message: "Déjà traité" });
    }

    // Vérification du montant avec Flutterwave (sécurité)
    const verifyResponse = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      headers: {
        Authorization: `Bearer ${process.env.FLW_SECRET_KEY}`,
      },
    });
    const verifyData = await verifyResponse.json();

    if (
      verifyData.status !== "success" ||
      verifyData.data.status !== "successful" ||
      verifyData.data.amount < payment.amount
    ) {
      console.error("Vérification Flutterwave échouée:", verifyData);
      await prisma.payment.update({
        where: { id: paymentId },
        data: { status: "FAILED" },
      });
      return NextResponse.json({ received: true, verified: false });
    }

    // Calculer la nouvelle date d'expiration
    const expirationDate = calculateExpirationDate(payment.billingPeriod);

    // Mettre à jour le paiement et l'abonnement de l'utilisateur en une seule transaction
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: paymentId },
        data: {
          status: "SUCCESS",
          flwRef,
          transactionId,
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

    console.log(`✅ Abonnement activé pour ${payment.user.email} - Plan: ${payment.plan} - Expire: ${expirationDate}`);

    return NextResponse.json({ received: true, success: true });
  } catch (error: any) {
    console.error("Erreur webhook Flutterwave:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
