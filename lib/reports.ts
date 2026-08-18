/**
 * Report Exporter & Template Generator
 * Multi-format exporter: PDF/HTML with colorful charts, Excel XML, CSV, and JSON
 */

export interface ReportData {
  id: string;
  title: string;
  type: "PROGRESS" | "WORKLOAD" | "ACTIVITY" | "FINANCIAL" | string;
  period?: string;
  projectName?: string;
  generatedAt: string;
  stats: {
    totalTasks: number;
    completedTasks: number;
    inProgressTasks: number;
    overdueTasks?: number;
    todoTasks?: number;
    progress?: number;
    budget?: number;
    spent?: number;
  };
  membersWorkload?: { name: string; email?: string; role?: string; assignedTasks: number; completedTasks: number }[];
  activityLogs?: { action: string; user: string; date: string }[];
  notes?: string;
}

/**
 * Generates formatted CSV
 */
export function generateCSVReport(report: ReportData): string {
  const lines: string[] = [];
  lines.push(`"Rapport TeamFlows - ${report.title}"`);
  lines.push(`"Généré le","${new Date(report.generatedAt).toLocaleString("fr-FR")}"`);
  lines.push(`"Type","${report.type}"`);
  if (report.projectName) lines.push(`"Projet","${report.projectName}"`);
  lines.push("");

  lines.push(`"INDICATEURS ET PERFORMANCES"`);
  lines.push(`"Tâches totales",${report.stats.totalTasks}`);
  lines.push(`"Tâches terminées",${report.stats.completedTasks}`);
  lines.push(`"Tâches en cours",${report.stats.inProgressTasks}`);
  if (report.stats.todoTasks !== undefined) lines.push(`"Tâches à faire",${report.stats.todoTasks}`);
  if (report.stats.progress !== undefined) lines.push(`"Progression globale",${report.stats.progress}%`);
  if (report.stats.budget) lines.push(`"Budget total",${report.stats.budget} €`);
  if (report.stats.spent) lines.push(`"Dépenses actuelles",${report.stats.spent} €`);
  lines.push("");

  if (report.membersWorkload && report.membersWorkload.length > 0) {
    lines.push(`"REPARTITION DE LA CHARGE PAR MEMBRE"`);
    lines.push(`"Nom","Rôle","Tâches Assignées","Tâches Terminées"`);
    report.membersWorkload.forEach((m) => {
      lines.push(`"${m.name}","${m.role || 'Membre'}",${m.assignedTasks},${m.completedTasks}`);
    });
    lines.push("");
  }

  if (report.activityLogs && report.activityLogs.length > 0) {
    lines.push(`"HISTORIQUE DES ACTIVITES RECENTES"`);
    lines.push(`"Action","Intervenant","Date"`);
    report.activityLogs.forEach((a) => {
      lines.push(`"${a.action}","${a.user}","${a.date}"`);
    });
  }

  return lines.join("\n");
}

/**
 * Generates Excel formatted XML file (.xls)
 */
export function generateExcelReport(report: ReportData): string {
  const dateStr = new Date(report.generatedAt).toLocaleString("fr-FR");
  const progressPct = report.stats.progress ?? (report.stats.totalTasks > 0 ? Math.round((report.stats.completedTasks / report.stats.totalTasks) * 100) : 0);

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" ss:Size="16" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>
   <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
  </Style>
  <Style ss:ID="SubHeader">
   <Font ss:FontName="Calibri" ss:Size="12" ss:Bold="1" ss:Color="#1E293B"/>
   <Interior ss:Color="#F1F5F9" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="BoldText">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1"/>
  </Style>
  <Style ss:ID="Cell">
   <Font ss:FontName="Calibri" ss:Size="11"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="Rapport">
  <Table>
   <Column ss:Width="200"/>
   <Column ss:Width="150"/>
   <Column ss:Width="120"/>
   <Column ss:Width="120"/>
   <Row ss:Height="40">
    <Cell ss:MergeAcross="3" ss:StyleID="Header"><Data ss:Type="String">TeamFlows — ${report.title}</Data></Cell>
   </Row>
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
   <Row><Cell ss:StyleID="BoldText"><Data ss:Type="String">Généré le :</Data></Cell><Cell ss:StyleID="Cell"><Data ss:Type="String">${dateStr}</Data></Cell></Row>
   <Row><Cell ss:StyleID="BoldText"><Data ss:Type="String">Projet :</Data></Cell><Cell ss:StyleID="Cell"><Data ss:Type="String">${report.projectName || "Général"}</Data></Cell></Row>
   <Row><Cell ss:StyleID="BoldText"><Data ss:Type="String">Type :</Data></Cell><Cell ss:StyleID="Cell"><Data ss:Type="String">${report.type}</Data></Cell></Row>
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
   <Row ss:StyleID="SubHeader">
    <Cell ss:MergeAcross="3"><Data ss:Type="String">SYNTHÈSE DES PERFORMANCE ET MÉTRIQUES</Data></Cell>
   </Row>
   <Row><Cell ss:StyleID="BoldText"><Data ss:Type="String">Progression Globale</Data></Cell><Cell ss:StyleID="Cell"><Data ss:Type="String">${progressPct}%</Data></Cell></Row>
   <Row><Cell ss:StyleID="BoldText"><Data ss:Type="String">Tâches Totales</Data></Cell><Cell ss:StyleID="Cell"><Data ss:Type="Number">${report.stats.totalTasks}</Data></Cell></Row>
   <Row><Cell ss:StyleID="BoldText"><Data ss:Type="String">Tâches Terminées</Data></Cell><Cell ss:StyleID="Cell"><Data ss:Type="Number">${report.stats.completedTasks}</Data></Cell></Row>
   <Row><Cell ss:StyleID="BoldText"><Data ss:Type="String">Tâches en cours</Data></Cell><Cell ss:StyleID="Cell"><Data ss:Type="Number">${report.stats.inProgressTasks}</Data></Cell></Row>
   ${report.stats.budget ? `<Row><Cell ss:StyleID="BoldText"><Data ss:Type="String">Budget Total</Data></Cell><Cell ss:StyleID="Cell"><Data ss:Type="String">${report.stats.budget.toLocaleString()} €</Data></Cell></Row>` : ''}
   ${report.stats.spent ? `<Row><Cell ss:StyleID="BoldText"><Data ss:Type="String">Dépenses Cumulées</Data></Cell><Cell ss:StyleID="Cell"><Data ss:Type="String">${report.stats.spent.toLocaleString()} €</Data></Cell></Row>` : ''}
   <Row><Cell><Data ss:Type="String"></Data></Cell></Row>
   ${report.membersWorkload && report.membersWorkload.length > 0 ? `
   <Row ss:StyleID="SubHeader">
    <Cell><Data ss:Type="String">Nom du Membre</Data></Cell>
    <Cell><Data ss:Type="String">Rôle</Data></Cell>
    <Cell><Data ss:Type="String">Tâches Assignées</Data></Cell>
    <Cell><Data ss:Type="String">Tâches Complétées</Data></Cell>
   </Row>
   ${report.membersWorkload.map(m => `
   <Row>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${m.name}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="String">${m.role || 'Membre'}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="Number">${m.assignedTasks}</Data></Cell>
    <Cell ss:StyleID="Cell"><Data ss:Type="Number">${m.completedTasks}</Data></Cell>
   </Row>`).join('')}
   ` : ''}
  </Table>
 </Worksheet>
</Workbook>`;
}

/**
 * Generates colorful, printable HTML report with SVG charts and styled CSS
 */
export function generateHTMLReport(report: ReportData): string {
  const dateStr = new Date(report.generatedAt).toLocaleDateString("fr-FR", { day: '2-digit', month: 'long', year: 'numeric' });
  const progressPct = report.stats.progress ?? (report.stats.totalTasks > 0 ? Math.round((report.stats.completedTasks / report.stats.totalTasks) * 100) : 0);

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>${report.title} — TeamFlows Report</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #F8FAFC; color: #0F172A; margin: 0; padding: 40px; }
    .card { background: white; border-radius: 24px; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.05); margin-bottom: 24px; border: 1px solid #E2E8F0; }
    .header { background: linear-gradient(135deg, #0F172A 0%, #1E1B4B 50%, #312E81 100%); color: white; border-radius: 32px; padding: 48px; margin-bottom: 32px; position: relative; overflow: hidden; }
    .header h1 { font-size: 36px; font-weight: 900; margin: 12px 0; }
    .badge { display: inline-block; padding: 6px 16px; background: rgba(255,255,255,0.15); border-radius: 20px; font-size: 11px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; border: 1px solid rgba(255,255,255,0.2); }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px; }
    .stat-box { background: white; padding: 24px; border-radius: 20px; border: 1px solid #E2E8F0; text-align: center; }
    .stat-val { font-size: 32px; font-weight: 900; color: #4F46E5; margin-bottom: 4px; }
    .stat-lbl { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748B; letter-spacing: 1px; }
    .progress-bar-bg { height: 12px; background: #E2E8F0; border-radius: 6px; overflow: hidden; margin-top: 8px; }
    .progress-bar-fill { height: 100%; background: linear-gradient(90deg, #6366F1, #10B981); border-radius: 6px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th { text-align: left; padding: 12px 16px; background: #F8FAFC; color: #64748B; font-size: 11px; font-weight: 900; text-transform: uppercase; border-bottom: 2px solid #E2E8F0; }
    td { padding: 14px 16px; font-size: 13px; font-weight: 600; border-bottom: 1px solid #F1F5F9; }
    @media print { body { padding: 0; background: white; } .card { box-shadow: none; } }
  </style>
</head>
<body>
  <div class="header">
    <span class="badge">${report.type} REPORT</span>
    <h1>${report.title}</h1>
    <p style="opacity: 0.8; font-size: 14px; font-weight: 600;">Généré automatiquement par <strong>TeamFlows</strong> le ${dateStr} · Projet : ${report.projectName || 'Général'}</p>
  </div>

  <div class="grid-3">
    <div class="stat-box">
      <div class="stat-val" style="color: #4F46E5;">${progressPct}%</div>
      <div class="stat-lbl">Avancement global</div>
      <div class="progress-bar-bg"><div class="progress-bar-fill" style="width: ${progressPct}%"></div></div>
    </div>
    <div class="stat-box">
      <div class="stat-val" style="color: #10B981;">${report.stats.completedTasks} / ${report.stats.totalTasks}</div>
      <div class="stat-lbl">Tâches complétées</div>
    </div>
    <div class="stat-box">
      <div class="stat-val" style="color: #F59E0B;">${report.stats.spent ? report.stats.spent.toLocaleString() + ' €' : 'N/A'}</div>
      <div class="stat-lbl">Budget consommé</div>
    </div>
  </div>

  ${report.notes ? `
  <div class="card">
    <h3 style="font-size: 18px; font-weight: 900; margin-top: 0;">Analyse & Notes de Synthèse</h3>
    <p style="font-size: 14px; color: #475569; line-height: 1.7; white-space: pre-wrap;">${report.notes}</p>
  </div>` : ''}

  ${report.membersWorkload && report.membersWorkload.length > 0 ? `
  <div class="card">
    <h3 style="font-size: 18px; font-weight: 900; margin-top: 0;">Répartition de la charge de travail</h3>
    <table>
      <thead>
        <tr>
          <th>Collaborateur</th>
          <th>Rôle</th>
          <th>Tâches assignées</th>
          <th>Tâches terminées</th>
          <th>Taux de réussite</th>
        </tr>
      </thead>
      <tbody>
        ${report.membersWorkload.map(m => `
        <tr>
          <td><strong>${m.name}</strong></td>
          <td>${m.role || 'Membre'}</td>
          <td>${m.assignedTasks}</td>
          <td>${m.completedTasks}</td>
          <td><span style="color: #10B981; font-weight: 900;">${m.assignedTasks > 0 ? Math.round((m.completedTasks / m.assignedTasks) * 100) : 0}%</span></td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}

  ${report.activityLogs && report.activityLogs.length > 0 ? `
  <div class="card">
    <h3 style="font-size: 18px; font-weight: 900; margin-top: 0;">Historique des faits marquants</h3>
    <table>
      <thead>
        <tr><th>Événement</th><th>Auteur</th><th>Date</th></tr>
      </thead>
      <tbody>
        ${report.activityLogs.map(a => `
        <tr>
          <td>${a.action}</td>
          <td><strong>${a.user}</strong></td>
          <td style="color: #64748B;">${a.date}</td>
        </tr>`).join('')}
      </tbody>
    </table>
  </div>` : ''}
</body>
</html>`;
}

/**
 * Downloads file in browser in chosen format: pdf (print html), xls, csv, html, json
 */
export function downloadReportFile(filename: string, content: string, format: "pdf" | "xls" | "csv" | "html" | "json") {
  if (format === "pdf") {
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(content);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }
    return;
  }

  const mimeTypes: Record<string, string> = {
    csv: "text/csv;charset=utf-8;",
    xls: "application/vnd.ms-excel;charset=utf-8;",
    html: "text/html;charset=utf-8;",
    json: "application/json;charset=utf-8;",
  };

  const blob = new Blob([content], { type: mimeTypes[format] || "text/plain;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.${format}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
