"use client";
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import LoadingScreen from '@/components/ui/LoadingScreen';
import {
  ArrowLeft,
  UserPlus,
  Search,
  MoreVertical,
  Mail,
  Phone,
  Shield,
  Crown,
  User,
  Eye,
  Edit,
  Trash2,
  Check,
  X,
  Star,
  TrendingUp,
  CheckCircle2,
  Clock,
  Users,
  Loader2,
} from 'lucide-react';
import { Card, StatCard } from '@/components/ui/Card';
import UserSelector from "@/components/UserSelector";
import { useProjectMembers } from "@/hooks/useProjectMembers";
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

// Types
interface Member {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar: string;
  image?: string;
  role: 'owner' | 'manager' | 'contributor' | 'viewer';
  joinedAt: Date;
  stats?: {
    assignedTasksCount: number;
    completedTasksCount: number;
    completionRate: number;
  };
}

interface ProjectMember {
  projectId: string;
  projectName: string;
  owner: Member;
  members: Member[];
}

interface UserSearchResult {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

const roleConfig = {
  owner: {
    label: 'Propriétaire',
    icon: Crown,
    color: 'text-yellow-600',
    bg: 'bg-yellow-100',
    gradient: 'from-yellow-500 to-amber-500',
  },
  manager: {
    label: 'Manager',
    icon: Shield,
    color: 'text-blue-600',
    bg: 'bg-blue-100',
    gradient: 'from-blue-500 to-cyan-500',
  },
  contributor: {
    label: 'Contributeur',
    icon: User,
    color: 'text-green-600',
    bg: 'bg-green-100',
    gradient: 'from-green-500 to-emerald-500',
  },
  viewer: {
    label: 'Observateur',
    icon: Eye,
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    gradient: 'from-slate-500 to-slate-600',
  },
};

export default function ProjectMembersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const [projectData, setProjectData] = useState<ProjectMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Add member state
  const [userSearch, setUserSearch] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const { projectData: fetchedProjectData, addMember, removeMember, updateMemberRole, loading, error } = useProjectMembers(params.id as string);
  const [newMemberRole, setNewMemberRole] = useState<'manager' | 'contributor'>('contributor');

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (fetchedProjectData) {
      setProjectData(fetchedProjectData as any);
    }
  }, [fetchedProjectData]);

  const isLoading = loading;

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // First, try to get contacts for this project
      const contactsResponse = await fetch(`/api/projects/${params.id}/contacts`);
      
      if (contactsResponse.ok) {
        const contacts = await contactsResponse.json();
        
        // Filter contacts by search query
        const filteredContacts = contacts.filter((contact: UserSearchResult) =>
          contact.name?.toLowerCase().includes(query.toLowerCase()) ||
          contact.email.toLowerCase().includes(query.toLowerCase())
        );
        
        setSearchResults(filteredContacts);
      } else {
        // Fallback to all users if contacts API fails
        const response = await fetch(`/api/admin/users?search=${encodeURIComponent(query)}`);
        if (response.ok) {
          const data = await response.json();
          const existingMemberIds = [
            projectData?.owner.userId,
            ...(projectData?.members.map(m => m.userId) || [])
          ];
          const filteredUsers = (Array.isArray(data) ? data : data.users || []).filter(
            (user: UserSearchResult) => !existingMemberIds.includes(user.id)
          );
          setSearchResults(filteredUsers);
        }
      }
    } catch (error) {
      console.error('Erreur lors de la recherche:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Load contacts when modal opens
  useEffect(() => {
    if (showAddModal) {
      const loadContacts = async () => {
        try {
          const response = await fetch(`/api/projects/${params.id}/contacts`);
          if (response.ok) {
            const contacts = await response.json();
            setSearchResults(contacts);
          }
        } catch (error) {
          console.error('Erreur lors du chargement des contacts:', error);
        }
      };
      loadContacts();
    }
  }, [showAddModal, params.id]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (userSearch) {
        searchUsers(userSearch);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [userSearch]);

  const handleAddMember = async () => {
    if (!selectedUser) return;

    setIsSubmitting(true);
    try {
      await addMember(selectedUser.id, newMemberRole);
      setShowAddModal(false);
      resetAddModal();
    } catch (error) {
      alert('Erreur ajout membre');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!selectedMember) return;

    setIsSubmitting(true);
    try {
      const success = await updateMemberRole(
        selectedMember.id,
        selectedMember.role as 'manager' | 'contributor'
      );

      if (success) {
        setShowEditModal(false);
        setSelectedMember(null);
      } else {
        alert('Erreur lors de la mise à jour du rôle');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du rôle:', error);
      alert('Erreur lors de la mise à jour du rôle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Retirer membre ?')) return;
    await removeMember(memberId);
  };

  const resetAddModal = () => {
    setUserSearch('');
    setSearchResults([]);
    setSelectedUser(null);
    setNewMemberRole('contributor');
  };

  const members = projectData?.members || [];
  const owner = projectData?.owner;
  
  const filteredMembers = members.filter((member) =>
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isOwner = session?.user?.email === owner?.email;

  if (status === "loading" || (status === "authenticated" && isLoading)) {
    return <LoadingScreen />;
  }

  if (status === "unauthenticated" || !session) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-4">
            <Link href={`/projects/${params.id}`}>
              <Button variant="ghost" icon={ArrowLeft}>
                Retour au projet
              </Button>
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-display font-bold text-slate-900 mb-2">
                Gestion de l'équipe
              </h1>
              <p className="text-lg text-slate-600">
                {projectData?.projectName}
              </p>
              <p className="text-sm text-slate-500 mt-1">
                {filteredMembers.length + 1} membre{filteredMembers.length > 0 ? 's' : ''} (propriétaire inclus)
              </p>
            </div>

            {isOwner && (
              <Button
                variant="primary"
                icon={UserPlus}
                onClick={() => setShowAddModal(true)}
              >
                Ajouter un membre
              </Button>
            )}
          </div>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <Card hover={false}>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher un membre..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 transition-all"
              />
            </div>
          </Card>
        </motion.div>

        {/* Members List */}
        <motion.div
          variants={{
            hidden: { opacity: 0 },
            show: {
              opacity: 1,
              transition: {
                staggerChildren: 0.05,
              },
            },
          }}
          initial="hidden"
          animate="show"
          className="space-y-4"
        >
          {/* Owner */}
          {owner && (
            <motion.div
              variants={{
                hidden: { opacity: 0, x: -20 },
                show: { opacity: 1, x: 0 },
              }}
            >
              <Card hover>
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                  {/* Avatar & Info */}
                  <div className="flex items-center gap-4 flex-1">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-500 to-amber-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                        {owner.avatar}
                      </div>
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center">
                        <Star className="w-4 h-4 text-white fill-white" />
                      </div>
                    </div>

                    <div className="flex-1">
                      <h3 className="text-xl font-display font-bold text-slate-900 mb-1">
                        {owner.name}
                        <span className="ml-2 text-yellow-600">(Vous)</span>
                      </h3>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-slate-600">
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {owner.email}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Role Badge */}
                  <div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 rounded-xl">
                      <Crown className="w-5 h-5 text-yellow-600" />
                      <span className="font-semibold text-yellow-600">
                        Propriétaire
                      </span>
                    </div>
                  </div>

                  {/* Owner stats */}
                  <div className="grid grid-cols-3 gap-6 text-center">
                    <div>
                      <p className="text-2xl font-bold text-slate-900">{owner.stats?.assignedTasksCount || 0}</p>
                      <p className="text-sm text-slate-600">Assignées</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-green-600">{owner.stats?.completedTasksCount || 0}</p>
                      <p className="text-sm text-slate-600">Terminées</p>
                    </div>
                    <div>
                      <p className="text-2xl font-bold text-blue-600">{owner.stats?.completionRate || 0}%</p>
                      <p className="text-sm text-slate-600">Complété</p>
                    </div>
                  </div>

                  {/* Workload */}
                  <div className="min-w-[120px]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-700">
                        Charge
                      </span>
                      <span className="text-sm font-bold text-slate-900">
                        {owner.stats?.completionRate || 0}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all" 
                        style={{ width: `${owner.stats?.completionRate || 0}%` }}
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <span className="px-3 py-2 text-sm text-slate-500">
                      Ne peut pas être modifié
                    </span>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Members */}
          {filteredMembers.map((member) => {
            const roleKey = member.role?.toLowerCase() || 'viewer';
            const role = roleConfig[roleKey as keyof typeof roleConfig] || roleConfig.viewer;
            const RoleIcon = role.icon;

            return (
              <motion.div
                key={member.id}
                variants={{
                  hidden: { opacity: 0, x: -20 },
                  show: { opacity: 1, x: 0 },
                }}
                whileHover={{ x: 4, scale: 1.01 }}
              >
                <Card hover>
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Avatar & Info */}
                    <div className="flex items-center gap-4 flex-1">
                      <div className="relative">
                        <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${role.gradient} flex items-center justify-center text-white text-xl font-bold shadow-lg`}>
                          {member.avatar}
                        </div>
                      </div>

                      <div className="flex-1">
                        <h3 className="text-xl font-display font-bold text-slate-900 mb-1">
                          {member.name}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-slate-600">
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4" />
                            {member.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Role Badge */}
                    <div>
                      <div className={`flex items-center gap-2 px-4 py-2 ${role.bg} rounded-xl`}>
                        <RoleIcon className={`w-5 h-5 ${role.color}`} />
                        <span className={`font-semibold ${role.color}`}>
                          {role.label}
                        </span>
                      </div>
                    </div>

                    {/* Member stats */}
                    <div className="grid grid-cols-3 gap-6 text-center">
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{member.stats?.assignedTasksCount || 0}</p>
                        <p className="text-sm text-slate-600">Assignées</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{member.stats?.completedTasksCount || 0}</p>
                        <p className="text-sm text-slate-600">Terminées</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">{member.stats?.completionRate || 0}%</p>
                        <p className="text-sm text-slate-600">Complété</p>
                      </div>
                    </div>

                    {/* Workload */}
                    <div className="min-w-[120px]">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700">
                          Charge
                        </span>
                        <span className="text-sm font-bold text-slate-900">
                          {member.stats?.completionRate || 0}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all" 
                          style={{ width: `${member.stats?.completionRate || 0}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    {isOwner && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedMember(member);
                            setShowEditModal(true);
                          }}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit className="w-5 h-5 text-slate-600" />
                        </button>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                          title="Retirer"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                        </button>
                      </div>
                    )}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Empty State */}
        {filteredMembers.length === 0 && !owner && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-32 h-32 mx-auto mb-6 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center">
              <Users className="w-16 h-16 text-slate-400" />
            </div>
            <h3 className="text-2xl font-display font-bold text-slate-900 mb-2">
              Aucun membre trouvé
            </h3>
            <p className="text-slate-600 mb-6">
              {searchQuery ? 'Essayez de modifier vos critères de recherche' : 'Ajoutez des membres à votre projet'}
            </p>
            {isOwner && !searchQuery && (
              <Button
                variant="primary"
                icon={UserPlus}
                onClick={() => setShowAddModal(true)}
              >
                Ajouter un membre
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {/* Add Member Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowAddModal(false);
              resetAddModal();
            }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-slate-900">
                  Ajouter un membre
                </h2>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    resetAddModal();
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

  {/* UserSelector avec contacts prioritaires */}
  <UserSelector
    selectedUsers={[]}
    onUsersChange={(users) => {
      if (users.length > 0) {
        const u = users[0] as any;
        setSelectedUser({
          id: u.id,
          name: u.name || null,
          email: u.email || '',
          image: u.image || null,
        });
      }
    }}
    placeholder="Rechercher contacts/membres..."
    maxUsers={1}
    excludeUsers={[
      ...(owner ? [owner.userId] : []),
      ...members.map(m => m.userId)
    ]}
  />

  {/* Selected User */}
  {selectedUser && (
    <div className="mb-6 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-semibold">
            {selectedUser.name
              ? selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()
              : selectedUser.email.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-900">
              {selectedUser.name || 'Sans nom'}
            </p>
            <p className="text-sm text-slate-600">{selectedUser.email}</p>
          </div>
        </div>
        <button
          onClick={() => setSelectedUser(null)}
          className="p-2 hover:bg-white rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-slate-600" />
        </button>
      </div>
    </div>
  )}



              {/* Role Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Rôle
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setNewMemberRole('contributor')}
                    className={`
                      p-4 rounded-xl border-2 transition-all
                      ${newMemberRole?.toLowerCase() === 'contributor'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                      }
                    `}
                  >
                    <User className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <p className="font-semibold text-slate-900 text-sm">
                      Contributeur
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Accès basique
                    </p>
                  </button>
                  <button
                    onClick={() => setNewMemberRole('manager')}
                    className={`
                      p-4 rounded-xl border-2 transition-all
                      ${newMemberRole?.toLowerCase() === 'manager'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                      }
                    `}
                  >
                    <Shield className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="font-semibold text-slate-900 text-sm">
                      Manager
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Accès complet
                    </p>
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowAddModal(false);
                    resetAddModal();
                  }}
                  fullWidth
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  icon={UserPlus}
                  onClick={handleAddMember}
                  disabled={!selectedUser || isSubmitting}
                  loading={isSubmitting}
                  fullWidth
                >
                  Ajouter
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Member Modal */}
      <AnimatePresence>
        {showEditModal && selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setShowEditModal(false);
              setSelectedMember(null);
            }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-display font-bold text-slate-900">
                  Modifier le membre
                </h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedMember(null);
                  }}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Member Info */}
              <div className="flex items-center gap-4 mb-6 p-4 bg-slate-50 rounded-xl">
                <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${(roleConfig[selectedMember.role?.toLowerCase() as keyof typeof roleConfig] || roleConfig.viewer).gradient} flex items-center justify-center text-white text-xl font-bold`}>
                  {selectedMember.avatar}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">
                    {selectedMember.name}
                  </h3>
                  <p className="text-sm text-slate-600">{selectedMember.email}</p>
                </div>
              </div>

              {/* Role Selection */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-slate-700 mb-3">
                  Rôle
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setSelectedMember({ ...selectedMember, role: 'contributor' })}
                    className={`
                      p-4 rounded-xl border-2 transition-all
                      ${selectedMember.role?.toLowerCase() === 'contributor'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                      }
                    `}
                  >
                    <User className="w-6 h-6 mx-auto mb-2 text-green-600" />
                    <p className="font-semibold text-slate-900 text-sm">
                      Contributeur
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Accès basique
                    </p>
                  </button>
                  <button
                    onClick={() => setSelectedMember({ ...selectedMember, role: 'manager' })}
                    className={`
                      p-4 rounded-xl border-2 transition-all
                      ${selectedMember.role?.toLowerCase() === 'manager'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 hover:border-slate-300'
                      }
                    `}
                  >
                    <Shield className="w-6 h-6 mx-auto mb-2 text-blue-600" />
                    <p className="font-semibold text-slate-900 text-sm">
                      Manager
                    </p>
                    <p className="text-xs text-slate-600 mt-1">
                      Accès complet
                    </p>
                  </button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedMember(null);
                  }}
                  fullWidth
                >
                  Annuler
                </Button>
                <Button
                  variant="primary"
                  icon={Check}
                  onClick={handleUpdateRole}
                  disabled={isSubmitting}
                  loading={isSubmitting}
                  fullWidth
                >
                  Enregistrer
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
