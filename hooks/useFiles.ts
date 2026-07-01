import { useState, useEffect, useCallback } from "react";

interface File {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: string;
  projectId?: string | null;
  taskId?: string | null;
}

interface FilterOptions {
  projectId?: string;
  taskId?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function useFiles(filters: FilterOptions = {}) {
  const [files, setFiles] = useState<File[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const filtersKey = JSON.stringify(filters);

  const fetchFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, v]) => v !== undefined && v !== '')
        ),
      });

      const response = await fetch(`/api/files?${params}`);
      if (!response.ok) {
        throw new Error('Erreur chargement fichiers');
      }

      const data = await response.json();
      setFiles(Array.isArray(data.files) ? data.files : data || []);
      setTotal(data.total || data.length || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, [filtersKey, page]);

  useEffect(() => {
    fetchFiles();
  }, [fetchFiles]);

  
  const refresh = fetchFiles;

  const hasNextPage = page * 20 < total;
  const hasPrevPage = page > 1;

  const nextPage = () => setPage(p => p + 1);
  const prevPage = () => setPage(p => p - 1);

  return {
    files,
    loading,
    error,
    refresh,
    pagination: { page, total, hasNextPage, hasPrevPage, nextPage, prevPage },
  };
}

