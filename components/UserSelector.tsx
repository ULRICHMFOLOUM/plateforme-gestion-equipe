"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { useContacts } from "@/hooks/useContacts";
import { useUserSearch } from "@/hooks/useUserSearch";
import UserAvatar from "./ui/UserAvatar";

interface User {
  id: string;
  name: string | null;
  email: string;
  image?: string | null;
  role?: string;
}

interface UserSelectorProps {
  selectedUsers: User[];
  onUsersChange: (users: User[]) => void;
  placeholder?: string;
  maxUsers?: number;
  excludeUsers?: string[]; // e.g. current project members
  showRoleSelection?: boolean;
}

export default function UserSelector({
  selectedUsers,
  onUsersChange,
  placeholder = "Rechercher des contacts ou membres...",
  maxUsers = 10,
  excludeUsers = [],
  showRoleSelection = false,
}: UserSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  const { contacts, loading: contactsLoading, refresh } = useContacts();
  const {
    results: searchResults,
    setQuery: setSearchQuery,
    loading: searchLoading,
  } = useUserSearch();

  // Combined available users: contacts + search results
  const availableUsers = useCallback(() => {
    const selectedIds = new Set(selectedUsers.map((u) => u.id));
    const excludeIds = new Set(excludeUsers);

    // Filter contacts not selected/excluded
    const filteredContacts = (contacts || [])
      .filter(
        (c: any) =>
          !selectedIds.has(c.contactId) && !excludeIds.has(c.contactId),
      )
      .map((c: any) => ({
        id: c.contactId,
        name: c.name,
        email: c.email,
        image: c.image || c.avatar,
      }));

    // Filter search results
    const filteredSearch = (searchResults || [])
      .filter((u: any) => !selectedIds.has(u.id) && !excludeIds.has(u.id))
      .map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        image: u.image || u.avatar,
      }));

    return [...filteredContacts, ...filteredSearch];
  }, [contacts, searchResults, selectedUsers, excludeUsers]);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      setSearchQuery(searchTerm);
    } else {
      setSearchQuery("");
    }
  }, [searchTerm, setSearchQuery]);

  const isLoading = contactsLoading || searchLoading;
  const users = availableUsers();

  const addUser = (user: User) => {
    if (
      selectedUsers.length < maxUsers &&
      !selectedUsers.some((u) => u.id === user.id)
    ) {
      onUsersChange([...selectedUsers, { ...user, role: "CONTRIBUTOR" }]);
    }
    setSearchTerm("");
    setShowDropdown(false);
  };

  const removeUser = (userId: string) => {
    onUsersChange(selectedUsers.filter((user) => user.id !== userId));
    if (refresh) refresh(); // Refresh contacts
  };

  const updateRole = (userId: string, targetRole: string) => {
    onUsersChange(
      selectedUsers.map((user) => 
        user.id === userId ? { ...user, role: targetRole } : user
      )
    );
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Membres du projet (Contacts prioritaires)
      </label>

      {/* Barre de recherche */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={placeholder}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            onFocus={() => setShowDropdown(true)}
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>

        {/* Dropdown résultats */}
        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
            {users.map((user) => (
              <button
                key={user.id}
                onClick={() => addUser(user)}
                className="w-full px-4 py-2 text-left hover:bg-slate-50 focus:outline-none focus:bg-slate-50 flex items-center gap-3"
              >
                <UserAvatar 
                  src={user.image} 
                  name={user.name || user.email} 
                  size="sm" 
                />
                <div>
                  <div className="font-bold text-slate-900">
                    {user.name || user.email}
                  </div>
                  {user.name && (
                    <div className="text-[10px] text-slate-500">{user.email}</div>
                  )}
                  <div className="text-[10px] text-green-600 font-bold uppercase tracking-widest mt-0.5">✓ Contact</div>
                </div>
              </button>
            ))}
            {users.length === 0 && !isLoading && searchTerm && (
              <div className="px-4 py-2 text-sm text-gray-500 text-center">
                Aucun résultat trouvé
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sélectionnés */}
      {selectedUsers.length > 0 && (
        <div className="flex flex-col gap-2 mt-4">
          {selectedUsers.map((user) => (
            <div
              key={user.id}
              className="flex font-medium items-center justify-between px-4 py-2 rounded-xl text-sm bg-blue-50/50 text-slate-800 border border-blue-100/50 shadow-sm"
            >
              <div className="flex items-center">
                <UserAvatar 
                  src={user.image} 
                  name={user.name || user.email} 
                  size="xs" 
                  className="mr-3"
                />
                {user.name || user.email}
              </div>
              
              <div className="flex items-center gap-3">
                {showRoleSelection && (
                  <select 
                    value={user.role || "CONTRIBUTOR"}
                    onChange={(e) => updateRole(user.id, e.target.value)}
                    className="text-xs font-semibold bg-white border border-slate-200 text-slate-700 rounded-lg px-3 py-1.5 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="ADMIN">Chef de Projet</option>
                    <option value="CONTRIBUTOR">Membre</option>
                    <option value="VIEWER">Invité (Lecture seule)</option>
                  </select>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.preventDefault(); removeUser(user.id); }}
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          <span className="text-xs text-gray-500">
            ({selectedUsers.length}/{maxUsers})
          </span>
        </div>
      )}

      {selectedUsers.length >= maxUsers && (
        <p className="text-sm text-orange-600">
          Maximum {maxUsers} membres atteint
        </p>
      )}
      <p className="text-xs text-gray-500">
        {(contacts || []).length} contacts disponibles
      </p>
    </div>
  );
}
