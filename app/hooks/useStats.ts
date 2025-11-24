import { useMemo } from 'react';

interface Stat {
  label: string;
  value: string;
  icon: any;
  color: string;
  role?: string;
}

export function useStats(stats: Stat[], userRole: string | undefined) {
  // Memoize filtered stats
  const roleBasedStats = useMemo(() => {
    if (!userRole) return stats;
    return stats.filter((stat) => !stat.role || stat.role === userRole);
  }, [stats, userRole]);

  // Memoize total records
  const totalRecords = useMemo(() => {
    return stats.reduce((sum, stat) => {
      const numValue = parseInt(stat.value.replace(/,/g, '')) || 0;
      return sum + numValue;
    }, 0);
  }, [stats]);

  // Memoize stats count
  const statsCount = useMemo(() => {
    return stats.length;
  }, [stats]);

  return {
    roleBasedStats,
    totalRecords,
    statsCount,
  };
}