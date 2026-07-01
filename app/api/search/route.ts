import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim();

    if (!q || q.length < 2) {
      return NextResponse.json({ projects: [], tasks: [], users: [] });
    }

    const userId = session.user.id;

    const [projects, tasks, users] = await Promise.all([
      // Search projects where user is owner or member
      prisma.project.findMany({
        where: {
          AND: [
            { name: { contains: q } },
            {
              OR: [
                { ownerId: userId },
                { members: { some: { userId } } },
              ],
            },
          ],
        },
        select: { id: true, name: true, description: true, status: true, color: true },
        take: 5,
      }),

      // Search tasks where user is assignee or creator
      prisma.task.findMany({
        where: {
          AND: [
            { title: { contains: q } },
            {
              OR: [
                { assigneeId: userId },
                { userId },
              ],
            },
          ],
        },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          projectId: true,
          project: { select: { name: true } },
        },
        take: 5,
      }),

      // Search users (for teammates) - only if admin or show all
      prisma.user.findMany({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                { name: { contains: q } },
                { email: { contains: q } },
              ],
            },
          ],
        },
        select: { id: true, name: true, email: true, image: true, jobTitle: true },
        take: 3,
      }),
    ]);

    return NextResponse.json({ projects, tasks, users });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }
}
