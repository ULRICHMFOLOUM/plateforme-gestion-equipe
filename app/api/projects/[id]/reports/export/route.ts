import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const projectId = params.id;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "full";
    const format = searchParams.get("format") || "json";

    // Récup stats via reports API
    const statsRes = await fetch(
      `${request.nextUrl.origin}/api/projects/${projectId}/reports`,
    );
    if (!statsRes.ok) {
      throw new Error("Stats indisponibles");
    }
    const stats = await statsRes.json();

    let content: string;
    let filename: string;
    let contentType: string;

    switch (format.toLowerCase()) {
      case "csv":
        content = generateCSV(stats, type as string);
        filename = `${stats.projectName.replace(/[^a-z0-9]/gi, "_")}_rapport_${type}_${Date.now()}.csv`;
        contentType = "text/csv; charset=utf-8";
        break;
      case "pdf":
        // Mock PDF - en prod utiliser pdf-lib ou similaire
        content = generatePDFMock(stats, type as string);
        filename = `${stats.projectName.replace(/[^a-z0-9]/gi, "_")}_rapport_${type}_${Date.now()}.pdf`;
        contentType = "application/pdf";
        break;
      case "txt":
      default:
        content = generateTextReport(stats, type as string);
        filename = `${stats.projectName.replace(/[^a-z0-9]/gi, "_")}_rapport_${type}_${Date.now()}.txt`;
        contentType = "text/plain; charset=utf-8";
        break;
    }

    return new NextResponse(content, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    console.error("Erreur export rapport:", error);
    return NextResponse.json({ error: "Erreur export" }, { status: 500 });
  }
}

function generateCSV(stats: any, type: string): string {
  let csv = "Projet,Rapport," + new Date().toLocaleDateString("fr-FR") + "\n";
  csv += `Nom,${stats.projectName}\n`;

  if (type === "tasks" || type === "full") {
    csv += "\nTÂCHES:\n";
    csv += `Total,${stats.stats.tasks.total}\n`;
    csv += `Terminées,${stats.stats.tasks.done}\n`;
    csv += `Progression,${stats.stats.tasks.progress}%\n`;
  }

  if (type === "team" || type === "full") {
    csv += "\nÉQUIPE:\n";
    csv += `Membres,${stats.stats.members}\n`;
    csv += `Commentaires,${stats.stats.comments}\n`;
  }

  if (type === "budget" || type === "full") {
    csv += "\nBUDGET:\n";
    csv += `Total,${stats.stats.budget.total}€\n`;
    csv += `Dépensé,${stats.stats.budget.spent}€\n`;
    csv += `Utilisation,${stats.stats.budget.utilization}%\n`;
  }

  return csv;
}

function generateTextReport(stats: any, type: string): string {
  let report = `RAPPORT ${type.toUpperCase()} - ${stats.projectName}\n`;
  report += `Généré le : ${new Date(stats.generatedAt).toLocaleDateString("fr-FR")}\n\n`;

  if (type === "tasks" || type === "full") {
    report += `📊 TÂCHES :\n`;
    report += `- Total : ${stats.stats.tasks.total}\n`;
    report += `- Terminées : ${stats.stats.tasks.done}\n`;
    report += `- Progression : ${stats.stats.tasks.progress}%\n\n`;
  }

  report += `💰 BUDGET :\n`;
  report += `- Total : ${stats.stats.budget.total}€\n`;
  report += `- Utilisation : ${stats.stats.budget.utilization}%\n\n`;

  report += `👥 ÉQUIPE :\n`;
  report += `- Membres : ${stats.stats.members}\n`;
  report += `- Fichiers : ${stats.stats.files}\n`;

  return report;
}

function generatePDFMock(stats: any, type: string): string {
  // Mock PDF content (binary en prod)
  return `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R >>
endobj
4 0 obj
<< /Length 44 >>
stream
BT
/F1 24 Tf
100 700 Td
(${stats.projectName}) Tj
ET
endstream
endobj
xref
0 5
0000000000 65535 f 
0000000010 00000 n 
0000000075 00000 n 
0000000120 00000 n 
0000000192 00000 n 
trailer
<< /Size 5 /Root 1 0 R >>
startxref
300
%%EOF

RAPPORT ${type.toUpperCase()}

${generateTextReport(stats, type)}

(Fichier PDF simulé - utiliser pdfmake ou puppeteer en production)
`;
}
