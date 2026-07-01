import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const report = await prisma.report.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!report) {
      return NextResponse.json(
        { error: "Rapport non trouvé" },
        { status: 404 }
      );
    }

    // Générer un PDF simple (en vrai, on utiliserait une bibliothèque comme puppeteer ou pdfkit)
    const pdfContent = `
RAPPORT D'ADMINISTRATION
========================

Titre: ${report.title}
Type: ${report.type}
Généré par: ${report.user.name || report.user.email}
Date: ${new Date(report.createdAt).toLocaleDateString("fr-FR")}

CONTENU DU RAPPORT
==================

${report.content}

FIN DU RAPPORT
==============
    `.trim();

    // Pour une vraie implémentation, on convertirait en PDF
    // Ici on retourne du texte pour la démonstration
    const buffer = Buffer.from(pdfContent, "utf-8");

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="report-${params.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'export du rapport:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
