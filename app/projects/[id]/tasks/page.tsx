export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  CheckSquare,
  Clock,
  AlertCircle,
  User,
  Calendar,
  Edit,
  Trash2,
} from "lucide-react";

interface ProjectTasksPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectTasksPage({ params }: ProjectTasksPageProps) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      owner: true,
      tasks: {
        include: {
          assignee: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      },
      members: {
        include: {
          user: true,
        },
      },
    },
  });

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Projet non trouvé
          </h1>
          <p className="text-gray-600 mb-4">
            Le projet que vous recherchez n'existe pas.
          </p>
          <Link href="/projects" className="text-blue-600 hover:text-blue-500">
            Retour aux projets
          </Link>
        </div>
      </div>
    );
  }

  // Vérifier si l'utilisateur a accès à ce projet
  const isOwner = project.ownerId === session.user.id;
  const isMember = project.members.some(
    (member) => member.userId === session.user.id
  );

  if (!isOwner && !isMember) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Accès refusé
          </h1>
          <p className="text-gray-600 mb-4">
            Vous n'avez pas accès à ce projet.
          </p>
          <Link href="/projects" className="text-blue-600 hover:text-blue-500">
            Retour aux projets
          </Link>
        </div>
      </div>
    );
  }

  const taskStats = {
    total: project.tasks.length,
    todo: project.tasks.filter((task) => task.status === "TODO").length,
    inProgress: project.tasks.filter((task) => task.status === "IN_PROGRESS")
      .length,
    done: project.tasks.filter((task) => task.status === "DONE").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href={`/projects/${project.id}`}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au projet
          </Link>

          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Tâches - {project.name}
              </h1>
              <p className="mt-2 text-gray-600">{project.description}</p>
            </div>
            <div className="flex space-x-3">
              <Link
                href={`/projects/${project.id}/kanban`}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                Vue Kanban
              </Link>
              <Link
                href={`/projects/${project.id}/tasks/new`}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouvelle tâche
              </Link>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckSquare className="w-8 h-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">
                  Total des tâches
                </p>
                <p className="text-2xl font-semibold text-gray-900">
                  {taskStats.total}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertCircle className="w-8 h-8 text-yellow-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">À faire</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {taskStats.todo}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Clock className="w-8 h-8 text-blue-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">En cours</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {taskStats.inProgress}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckSquare className="w-8 h-8 text-green-500" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Terminées</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {taskStats.done}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Toutes les tâches
            </h2>
          </div>

          <div className="divide-y divide-gray-200">
            {project.tasks.map((task) => (
              <div key={task.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="text-sm font-medium text-gray-900 hover:text-blue-600"
                    >
                      {task.title}
                    </Link>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                      {task.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-2">
                      {task.assignee && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <User className="w-3 h-3" />
                          <span>{task.assignee.name || task.assignee.email}</span>
                        </div>
                      )}
                      {task.dueDate && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
                          <span>
                            {new Date(task.dueDate).toLocaleDateString("fr-FR")}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task.status === "DONE"
                          ? "bg-green-100 text-green-800"
                          : task.status === "IN_PROGRESS"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {task.status === "DONE"
                        ? "Terminée"
                        : task.status === "IN_PROGRESS"
                          ? "En cours"
                          : "À faire"}
                    </span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        task.priority === "HIGH"
                          ? "bg-red-100 text-red-800"
                          : task.priority === "MEDIUM"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                      }`}
                    >
                      {task.priority === "HIGH"
                        ? "Haute"
                        : task.priority === "MEDIUM"
                          ? "Moyenne"
                          : "Basse"}
                    </span>
                    <div className="flex space-x-1">
                      <Link
                        href={`/tasks/${task.id}`}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button className="p-1 text-gray-400 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {project.tasks.length === 0 && (
              <div className="px-6 py-12 text-center">
                <CheckSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-sm font-medium text-gray-900 mb-2">
                  Aucune tâche
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Commencez par créer votre première tâche pour ce projet.
                </p>
                <Link
                  href={`/projects/${project.id}/tasks/new`}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une tâche
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
