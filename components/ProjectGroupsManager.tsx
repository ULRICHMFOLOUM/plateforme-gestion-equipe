"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Users, Plus, X, UserPlus, UserMinus } from "lucide-react";

interface Group {
  id: string;
  name: string;
  description?: string;
  members: {
    id: string;
    userId: string;
    user: {
      id: string;
      name?: string;
      email: string;
    };
    role: "MEMBER" | "ADMIN";
  }[];
  _count: {
    members: number;
  };
}

interface ProjectGroupsManagerProps {
  projectId: string;
  isOwner: boolean;
}

export default function ProjectGroupsManager({
  projectId,
  isOwner,
}: ProjectGroupsManagerProps) {
  const { data: session } = useSession();
  const [assignedGroups, setAssignedGroups] = useState<Group[]>([]);
  const [availableGroups, setAvailableGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [projectId]);

  const fetchGroups = async () => {
    try {
      const response = await fetch(`/api/projects/${projectId}/groups`);
      if (response.ok) {
        const data = await response.json();
        setAssignedGroups(data.assignedGroups);
        setAvailableGroups(data.availableGroups);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des groupes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignGroup = async () => {
    if (!selectedGroupId) return;

    setIsAssigning(true);
    try {
      const response = await fetch(`/api/projects/${projectId}/groups`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ groupId: selectedGroupId }),
      });

      if (response.ok) {
        setShowAddModal(false);
        setSelectedGroupId("");
        fetchGroups();
      }
    } catch (error) {
      console.error("Erreur lors de l'assignation du groupe:", error);
    } finally {
      setIsAssigning(false);
    }
  };

  const handleRemoveGroup = async (groupId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir retirer ce groupe du projet ?"))
      return;

    try {
      const response = await fetch(
        `/api/projects/${projectId}/groups?groupId=${groupId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        fetchGroups();
      }
    } catch (error) {
      console.error("Erreur lors du retrait du groupe:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="w-5 h-5 text-gray-400 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900">
              Groupes assignés
            </h2>
          </div>
          {isOwner && (
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter un groupe
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {assignedGroups.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">
              Aucun groupe assigné
            </h3>
            <p className="text-sm text-gray-500">
              {isOwner
                ? "Assignez des groupes pour collaborer avec votre équipe."
                : "Aucun groupe n'est encore assigné à ce projet."}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {assignedGroups.map((group) => (
              <div
                key={group.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900">
                    {group.name}
                  </h4>
                  {group.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {group.description}
                    </p>
                  )}
                  <div className="flex items-center mt-2 text-xs text-gray-500">
                    <Users className="w-3 h-3 mr-1" />
                    {group._count.members} membre
                    {group._count.members > 1 ? "s" : ""}
                  </div>
                </div>
                {isOwner && (
                  <button
                    onClick={() => handleRemoveGroup(group.id)}
                    className="ml-4 p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="Retirer le groupe"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal d'ajout de groupe */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Ajouter un groupe au projet
              </h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sélectionner un groupe
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Choisir un groupe...</option>
                  {availableGroups.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.name} ({group._count.members} membre
                      {group._count.members > 1 ? "s" : ""})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAssignGroup}
                  disabled={isAssigning || !selectedGroupId}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAssigning ? "Ajout..." : "Ajouter"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
