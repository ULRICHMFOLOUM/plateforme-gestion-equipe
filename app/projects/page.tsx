export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import ProjectsList from "@/components/ProjectsList";
import DashboardWrapper from "@/components/layout/DashboardWrapper";

export default async function ProjectsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  // Fetch projects with enriched data
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        {
          members: {
            some: {
              userId: session.user.id,
            },
          },
        },
      ],
    },
    include: {
      owner: true,
      tasks: {
        select: {
          status: true,
        },
      },
      members: {
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  // Transform data to match expected format
  const transformedProjects = projects.map((project) => {
    const totalTasks = project.tasks.length;
    const completedTasks = project.tasks.filter(
      (t) => t.status === "DONE",
    ).length;
    const inProgressTasks = project.tasks.filter(
      (t) => t.status === "IN_PROGRESS",
    ).length;

    // Parse tags from string to array
    const tags = project.tags
      ? project.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [];

    // Map status to French labels
    const statusMap: Record<
      string,
      "planning" | "in_progress" | "completed" | "on_hold" | "cancelled"
    > = {
      ACTIVE: "in_progress",
      COMPLETED: "completed",
      ARCHIVED: "on_hold",
    };

    return {
      id: project.id,
      name: project.name,
      description: project.description || "",
      status: statusMap[project.status] || "planning",
      priority: (project.priority || "MEDIUM").toLowerCase() as "low" | "medium" | "high" | "urgent",
      progress: project.progress,
      startDate: project.startDate ? project.startDate.toISOString() : null,
      endDate: project.endDate ? project.endDate.toISOString() : null,
      budget: project.budget,
      spent: project.spent,
      owner: {
        id: project.owner.id,
        name: project.owner.name || project.owner.email,
        avatar: project.owner.name
          ? project.owner.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
          : project.owner.email.substring(0, 2).toUpperCase(),
      },
      members: project.members.map((m) => ({
        id: m.user.id,
        name: m.user.name || m.user.email,
        avatar: m.user.name
          ? m.user.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
          : m.user.email.substring(0, 2).toUpperCase(),
        role: m.role,
      })),
      tasks: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
      },
      isFavorite: project.isFavorite,
      color: project.color,
      tags,
    };
  });

  // Calculate stats
  const stats = {
    total: projects.length,
    inProgress: projects.filter((p) => p.status === "ACTIVE").length,
    completed: projects.filter((p) => p.status === "COMPLETED").length,
    onHold: projects.filter((p) => p.status === "ARCHIVED").length,
  };

  return (
    <DashboardWrapper>
      <ProjectsList
        projects={transformedProjects}
        currentUserId={session.user.id}
        stats={stats}
      />
    </DashboardWrapper>
  );
}
