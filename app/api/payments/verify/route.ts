import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { calculateExpirationDate } from "@/lib/subscription";

const FAPSHI_API_USER = process.env.FAPSHI_API_USER || "";
const FAPSHI_API_KEY = process.env.FAPSHI_API_KEY || "";

/**
 * POST /api/payments/verify
 * Appelé après redirection depuis Fapshi pour vérifier et activer le paiement.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { tx_ref, transaction_id, status } = await req.json();
    const paymentId = tx_ref || transaction_id;

    if (!paymentId) {
      return NextResponse.json({ error: "Identifiant de paiement manquant" }, { status: 400 });
    }

    // Récupérer le paiement en base (par id interne ou transactionId Fapshi)
    const payment = await prisma.payment.findFirst({
      where: {
        OR: [{ id: paymentId }, { transactionId: paymentId }],
      },
      include: { user: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Paiement introuvable" }, { status: 404 });
    }

    // Vérifier l'appartenance de la transaction
    if (payment.userId !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Déjà activé
    if (payment.status === "SUCCESS") {
      return NextResponse.json({ success: true, message: "Paiement déjà activé", alreadyActive: true });
    }

    let verified = false;
    let fapshiTransId = payment.transactionId || transaction_id;

    // Vérifier auprès du serveur Fapshi
    if (fapshiTransId) {
      try {
        const verifyRes = await fetch(`https://live.fapshi.com/payment-status/${fapshiTransId}`, {
          method: "GET",
          headers: {
            apiuser: FAPSHI_API_USER,
            apikey: FAPSHI_API_KEY,
          },
        });

        if (verifyRes.ok) {
          const verifyData = await verifyRes.json();
          if (verifyData.status === "SUCCESSFUL" || verifyData.status === "SUCCESS") {
            verified = true;
          }
        }
      } catch (e) {
        console.error("Erreur vérification Fapshi status:", e);
      }
    }

    // En cas de redirection directe Fapshi avec success status dans l'URL
    if (!verified && (status === "SUCCESSFUL" || status === "successful" || status === "success")) {
      verified = true;
    }

    if (!verified) {
      return NextResponse.json({ success: false, message: "Paiement en attente de confirmation Mobile Money" });
    }

    // Calculer la date d'expiration de l'abonnement
    const expirationDate = calculateExpirationDate(payment.billingPeriod);

    // Mettre à jour l'abonnement en transaction atomic
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "SUCCESS",
          transactionId: fapshiTransId || undefined,
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

    console.log(`✅ Paiement Fapshi confirmé pour ${payment.user.email} - Plan ${payment.plan}`);

    return NextResponse.json({
      success: true,
      plan: payment.plan,
      expiresAt: expirationDate.toISOString(),
    });
  } catch (error: any) {
    console.error("Erreur vérification paiement Fapshi:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
