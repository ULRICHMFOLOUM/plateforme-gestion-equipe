"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LoadingScreen from "@/components/ui/LoadingScreen";
import {
  Users,
  UserPlus,
  UserMinus,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Crown,
  Shield,
} from "lucide-react";

interface Group {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  memberCount: number;
  members: GroupMember[];
}

interface GroupMember {
  id: string;
  userId: string;
  user: {
    id: string;
    name?: string;
    email: string;
  };
  role: "MEMBER" | "ADMIN";
}

interface User {
  id: string;
  name?: string;
  email: string;
}

export default function AdminGroupsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  const fetchData = async () => {
    setIsLoading(true);
    await Promise.all([fetchGroups(), fetchUsers()]);
    setIsLoading(false);
  };

  useEffect(() => {
    if (status === "authenticated" && session?.user.role === "ADMIN") {
      fetchData();
    } else if (status === "authenticated" && session?.user.role !== "ADMIN") {
      router.push("/dashboard");
    }
  }, [status, session, router]);

  const fetchGroups = async () => {
    try {
      const response = await fetch("/api/admin/groups");
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des groupes:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Erreur lors de la récupération des utilisateurs:", error);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/admin/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newGroupName,
          description: newGroupDescription,
        }),
      });

      if (response.ok) {
        setShowCreateModal(false);
        setNewGroupName("");
        setNewGroupDescription("");
        fetchGroups();
      }
    } catch (error) {
      console.error("Erreur lors de la création du groupe:", error);
    }
  };

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGroup || !selectedUserId) return;

    try {
      const response = await fetch(
        `/api/admin/groups/${selectedGroup.id}/members`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: selectedUserId,
          }),
        }
      );

      if (response.ok) {
        setShowAddMemberModal(false);
        setSelectedUserId("");
        fetchGroups();
      }
    } catch (error) {
      console.error("Erreur lors de l'ajout du membre:", error);
    }
  };

  const handleRemoveMember = async (groupId: string, userId: string) => {
    try {
      const response = await fetch(
        `/api/admin/groups/${groupId}/members/${userId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        fetchGroups();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du membre:", error);
    }
  };

  const handleDeleteGroup = async (groupId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce groupe ?")) return;

    try {
      const response = await fetch(`/api/admin/groups/${groupId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchGroups();
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du groupe:", error);
    }
  };

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return <LoadingScreen />;
  }

  if (status === "unauthenticated" || !session) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Gestion des groupes
            </h1>
            <p className="mt-2 text-gray-600">
              Gérez les groupes et leurs membres
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Plus className="w-4 h-4 mr-2" />
            Nouveau groupe
          </button>
        </div>

        {/* Recherche */}
        <div className="mb-6">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher des groupes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Liste des groupes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((group) => (
            <div
              key={group.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {group.name}
                  </h3>
                  {group.description && (
                    <p className="text-sm text-gray-600 mt-1">
                      {group.description}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedGroup(group);
                      setShowAddMemberModal(true);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="Ajouter un membre"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteGroup(group.id)}
                    className="p-1 text-gray-400 hover:text-red-600"
                    title="Supprimer le groupe"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">
                  {group.memberCount} membre{group.memberCount > 1 ? "s" : ""}
                </span>
                <span className="text-xs text-gray-400">
                  Créé le{" "}
                  {new Date(group.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>

              {/* Membres */}
              <div className="space-y-2">
                {group.members.slice(0, 3).map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <div className="w-6 h-6 bg-gray-300 rounded-full flex items-center justify-center mr-2">
                        <Users className="w-3 h-3 text-gray-600" />
                      </div>
                      <span className="text-sm text-gray-700">
                        {member.user.name || member.user.email}
                      </span>
                      {member.role === "ADMIN" && (
                        <Crown className="w-3 h-3 text-yellow-500 ml-1" />
                      )}
                    </div>
                    <button
                      onClick={() =>
                        handleRemoveMember(group.id, member.userId)
                      }
                      className="text-red-400 hover:text-red-600"
                      title="Retirer du groupe"
                    >
                      <UserMinus className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {group.members.length > 3 && (
                  <p className="text-xs text-gray-500">
                    +{group.members.length - 3} autres membres
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredGroups.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Aucun groupe trouvé
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? "Aucun groupe ne correspond à votre recherche."
                : "Commencez par créer votre premier groupe."}
            </p>
          </div>
        )}

        {/* Modal création de groupe */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Créer un nouveau groupe
                </h3>
                <form onSubmit={handleCreateGroup}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom du groupe
                    </label>
                    <input
                      type="text"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description (optionnel)
                    </label>
                    <textarea
                      value={newGroupDescription}
                      onChange={(e) => setNewGroupDescription(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                      Créer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Modal ajout de membre */}
        {showAddMemberModal && selectedGroup && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Ajouter un membre à {selectedGroup.name}
                </h3>
                <form onSubmit={handleAddMember}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sélectionner un utilisateur
                    </label>
                    <select
                      value={selectedUserId}
                      onChange={(e) => setSelectedUserId(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Choisir un utilisateur...</option>
                      {users
                        .filter(
                          (user) =>
                            !selectedGroup.members.some(
                              (member) => member.userId === user.id
                            )
                        )
                        .map((user) => (
                          <option key={user.id} value={user.id}>
                            {user.name || user.email}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowAddMemberModal(false)}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                    >
                      Ajouter
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
