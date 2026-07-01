export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TasksList from "@/components/TasksList";
import DashboardWrapper from "@/components/layout/DashboardWrapper";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Fetch tasks where user is creator or assignee
  const tasks = await prisma.task.findMany({
    where: {
      OR: [
        { userId: session.user.id },
        { assigneeId: session.user.id },
      ],
    },
    include: {
      project: {
        select: {
          id: true,
          name: true,
        },
      },
      assignee: {
        select: {
          name: true,
          email: true,
          image: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Transform data for the client component
  const transformedTasks = tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description || "",
    status: task.status as "TODO" | "IN_PROGRESS" | "DONE",
    priority: task.priority as "LOW" | "MEDIUM" | "HIGH",
    dueDate: task.dueDate ? task.dueDate.toISOString() : null,
    assignee: task.assignee ? {
      name: task.assignee.name || task.assignee.email,
      email: task.assignee.email,
      image: task.assignee.image || undefined,
    } : undefined,
    project: task.project ? {
      id: task.project.id,
      name: task.project.name,
    } : undefined,
  }));

  return (
    <DashboardWrapper>
      <TasksList tasks={transformedTasks} currentUserId={session.user.id} />
    </DashboardWrapper>
  );
}
