import { useState, useEffect, useCallback } from "react";

export interface SearchedUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  image?: string;
  firstName?: string;
  lastName?: string;
}

export function useUserSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const searchUsers = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "search",
          email: searchQuery,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to search users");
      }

      const data = await response.json();

      // Transform API data
      const transformedUsers: SearchedUser[] = Array.isArray(data)
        ? data.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email,
            avatar: u.avatar,
            image: u.image,
            firstName: u.name?.split(" ")[0] || "",
            lastName: u.name?.split(" ").slice(1).join(" ") || "",
          }))
        : [];

      setResults(transformedUsers);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query) {
        searchUsers(query);
      } else {
        setResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchUsers]);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setError(null);
  }, []);

  return {
    query,
    setQuery,
    results,
    loading,
    error,
    clearSearch,
  };
}
