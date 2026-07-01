import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get("projectId");
    const taskId = searchParams.get("taskId");

  const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const skip = (page - 1) * limit;

    const [files, total] = await Promise.all([
      prisma.file.findMany({
        where: {
          userId: session.user.id,
          ...(projectId && { projectId }),
          ...(taskId && { taskId }),
        },
        orderBy: {
          uploadedAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.file.count({
        where: {
          userId: session.user.id,
          ...(projectId && { projectId }),
          ...(taskId && { taskId }),
        },
      })
    ]);

    return NextResponse.json({ files, total });
  } catch (error) {
    console.error("Erreur lors de la récupération des fichiers:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
