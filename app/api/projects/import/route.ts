import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const userId = session.user.id;
    const body = await request.json();
    const { projectName, importType, fileData, tasksData } = body;

    if (!projectName || !fileData) {
      return NextResponse.json({ error: "Nom de projet et données requis" }, { status: 400 });
    }

    let parsedTasks: Array<{ title: string; description?: string; status: "TODO" | "IN_PROGRESS" | "DONE"; priority?: "LOW" | "MEDIUM" | "HIGH" }> = [];

    if (importType === "TRELLO") {
      try {
        const trelloJson = typeof fileData === "string" ? JSON.parse(fileData) : fileData;
        const listsMap: Record<string, "TODO" | "IN_PROGRESS" | "DONE"> = {};

        if (Array.isArray(trelloJson.lists)) {
          trelloJson.lists.forEach((l: any) => {
            const lname = (l.name || "").toLowerCase();
            if (lname.includes("done") || lname.includes("fait") || lname.includes("terminé")) {
              listsMap[l.id] = "DONE";
            } else if (lname.includes("doing") || lname.includes("cours") || lname.includes("progress")) {
              listsMap[l.id] = "IN_PROGRESS";
            } else {
              listsMap[l.id] = "TODO";
            }
          });
        }

        if (Array.isArray(trelloJson.cards)) {
          parsedTasks = trelloJson.cards.map((card: any) => ({
            title: card.name || "Tâche sans titre",
            description: card.desc || "",
            status: listsMap[card.idList] || "TODO",
            priority: card.due ? "HIGH" : "MEDIUM",
          }));
        }
      } catch (e) {
        return NextResponse.json({ error: "Fichier JSON Trello invalide" }, { status: 400 });
      }
    } else {
      // CSV or RAW format
      if (Array.isArray(tasksData)) {
        parsedTasks = tasksData.map((t: any) => ({
          title: t.title || t.Titre || t.Task || "Tâche importée",
          description: t.description || t.Description || "",
          status: (t.status || t.Statut || "").toString().toUpperCase().includes("DONE") || (t.status || t.Statut || "").toString().toUpperCase().includes("FAIT") ? "DONE" : (t.status || t.Statut || "").toString().toUpperCase().includes("PROGRESS") ? "IN_PROGRESS" : "TODO",
          priority: (t.priority || t.Priorité || "").toString().toUpperCase().includes("HIGH") || (t.priority || t.Priorité || "").toString().toUpperCase().includes("HAUTE") ? "HIGH" : "MEDIUM",
        }));
      }
    }

    const randomAccessCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    // Create the project in DB
    const project = await prisma.project.create({
      data: {
        name: projectName,
        accessCode: `PRJ-${randomAccessCode}`,
        status: "ACTIVE",
        progress: parsedTasks.length > 0 ? Math.round((parsedTasks.filter(t => t.status === "DONE").length / parsedTasks.length) * 100) : 0,
        owner: {
          connect: { id: userId }
        },
        members: {
          create: {
            userId: userId,
            role: "OWNER",
          },
        },
      },
    });

    // Bulk create tasks for project
    if (parsedTasks.length > 0) {
      await prisma.task.createMany({
        data: parsedTasks.map((t) => ({
          title: t.title,
          description: t.description,
          status: t.status,
          priority: t.priority || "MEDIUM",
          projectId: project.id,
          userId: userId,
          assigneeId: userId,
        })),
      });
    }

    return NextResponse.json({
      success: true,
      projectId: project.id,
      importedTasksCount: parsedTasks.length,
      message: `Projet "${project.name}" créé avec ${parsedTasks.length} tâches importées !`,
    });
  } catch (error) {
    console.error("Erreur import projet:", error);
    return NextResponse.json({ error: "Erreur lors de l'importation" }, { status: 500 });
  }
}
