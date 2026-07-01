export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Dashboard from "@/components/Dashboard";
import PageTransition from "@/components/PageTransition";
import DashboardWrapper from "@/components/layout/DashboardWrapper";


export default async function DashboardPage() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return null;
    }

    // Optimized Fetching with individual error handling to prevent total crash
    const [tasksResult, projectsResult, upcomingEventsResult] = await Promise.allSettled([
      prisma.task.findMany({
        where: { assigneeId: session.user.id },
        include: { project: true },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.project.findMany({
        where: {
          OR: [
            { ownerId: session.user.id },
            { members: { some: { userId: session.user.id } } },
          ],
        },
        orderBy: { updatedAt: "desc" },
      }),
      prisma.event.findMany({
        where: {
          userId: session.user.id,
          startDate: { gte: new Date() },
        },
        orderBy: { startDate: "asc" },
        take: 5,
      }),
    ]);

    const tasks = tasksResult.status === "fulfilled" ? tasksResult.value : [];
    const projects = projectsResult.status === "fulfilled" ? projectsResult.value : [];
    const upcomingEvents = upcomingEventsResult.status === "fulfilled" ? upcomingEventsResult.value : [];

    if (tasksResult.status === "rejected") console.error("Prisma Tasks Error:", tasksResult.reason);
    if (projectsResult.status === "rejected") console.error("Prisma Projects Error:", projectsResult.reason);
    if (upcomingEventsResult.status === "rejected") console.error("Prisma Events Error:", upcomingEventsResult.reason);

  return (
    <DashboardWrapper>
      <Dashboard 
        tasks={tasks.map(t => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          project: t.project ? { name: t.project.name } : undefined
        }))} 
        projects={projects.map(p => ({
          id: p.id,
          name: p.name,
          status: p.status
        }))} 
        events={upcomingEvents.map(e => ({
          id: e.id,
          title: e.title,
          startDate: e.startDate.toISOString()
        }))}
        stats={{
          summary: {
            projects: projects.length,
            avgProgress: 0,
            taskCompletionRate: 0,
            budget: { total: 0, spent: 0, utilization: 0 }
          },
          upcomingEvents: [],
          urgentTasks: []
        }}
      />
    </DashboardWrapper>
  );
  } catch (error: any) {
    console.error("Error in DashboardPage:", error);
    throw error;
  }
}
