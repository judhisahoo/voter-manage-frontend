'use client';

import { useCallback, useState, useRef } from 'react';
import { apiClient } from '@/app/lib/secureAxios';

interface SearchResult {
  epic_no: string;
  name: string;
  [key: string]: any;
}

export function useSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout>();

  const search = useCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.post<SearchResult[]>('/voter-data/search', {
        epicNumbers: query,
      });
      
      setResults(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const errorMsg = err.message || 'Search failed';
      setError(errorMsg);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Memoized debounced search
  const debouncedSearch = useCallback((query: string, delayMs: number = 500) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      search(query);
    }, delayMs);
  }, [search]);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    results,
    loading,
    error,
    search,
    debouncedSearch,
    clearResults,
  };
}