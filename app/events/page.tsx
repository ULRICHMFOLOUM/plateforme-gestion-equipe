export const dynamic = 'force-dynamic';
import { getServerSession } from "next-auth/next";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Calendar, Clock, MapPin, Users } from "lucide-react";

export default async function EventsPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  const events = await prisma.event.findMany({
    where: {
      userId: session.user.id,
    },
    include: {
      user: true,
      Project: true,
    },
    orderBy: {
      startDate: "asc",
    },
  });

  const upcomingEvents = events.filter(
    (event) => new Date(event.startDate) >= new Date()
  );
  const pastEvents = events.filter(
    (event) => new Date(event.startDate) < new Date()
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Événements</h1>
            <p className="mt-2 text-gray-600">
              Gérez vos événements et réunions d'équipe
            </p>
          </div>
          <Link
            href="/events/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-5 h-5 mr-2" />
            Nouvel événement
          </Link>
        </div>

        {/* Événements à venir */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Événements à venir
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      <Link
                        href={`/events/${event.id}`}
                        className="hover:text-blue-600"
                      >
                        {event.title}
                      </Link>
                    </h3>
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {event.description}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800`}
                  >
                    Événement
                  </span>
                </div>

                <div className="space-y-2 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    {new Date(event.startDate).toLocaleDateString("fr-FR", {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    {new Date(event.startDate).toLocaleTimeString("fr-FR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    {event.endDate && (
                      <>
                        {" - "}
                        {new Date(event.endDate).toLocaleTimeString("fr-FR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </>
                    )}
                  </div>
                  {event.location && (
                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      {event.location}
                    </div>
                  )}
                  {event.Project && (
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-2" />
                      Projet: {event.Project.name}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-xs text-gray-500">
                    Créé par {event.user.name || event.user.email}
                  </p>
                </div>
              </div>
            ))}

            {upcomingEvents.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <Calendar className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun événement à venir
                </h3>
                <p className="text-gray-500 mb-6">
                  Planifiez votre prochain événement pour rester organisé.
                </p>
                <Link
                  href="/events/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Créer un événement
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Événements passés */}
        {pastEvents.length > 0 && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Événements passés
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastEvents.slice(0, 6).map((event) => (
                <div
                  key={event.id}
                  className="bg-gray-50 rounded-lg border border-gray-200 p-6 opacity-75"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        <Link
                          href={`/events/${event.id}`}
                          className="hover:text-blue-600"
                        >
                          {event.title}
                        </Link>
                      </h3>
                      <p className="text-gray-500 text-sm mb-4 line-clamp-2">
                        {event.description}
                      </p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      Terminé
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      {new Date(event.startDate).toLocaleDateString("fr-FR")}
                    </div>
                    {event.Project && (
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        Projet: {event.Project.name}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
