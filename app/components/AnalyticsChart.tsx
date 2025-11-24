'use client';

import React, { useMemo } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import StatCard from './StatCard';
import { FaUsers, FaSearch, FaUser, FaShieldAlt } from 'react-icons/fa';

interface Stat {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  role?: string;
}

const ADMIN_STATS: Stat[] = [
  {
    label: 'Total Records',
    value: '12,458',
    icon: FaUsers,
    color: 'bg-blue-500',
    role: 'admin',
  },
  {
    label: 'Today Searches',
    value: '342',
    icon: FaSearch,
    color: 'bg-green-500',
    role: 'admin',
  },
  {
    label: 'Active Users',
    value: '28',
    icon: FaUser,
    color: 'bg-purple-500',
    role: 'admin',
  },
  {
    label: 'API Calls',
    value: '1,247',
    icon: FaShieldAlt,
    color: 'bg-orange-500',
    role: 'admin',
  },
];

const SUPPORT_STATS: Stat[] = [
  {
    label: 'My Searches',
    value: '84',
    icon: FaSearch,
    color: 'bg-blue-500',
    role: 'support',
  },
  {
    label: 'Records Found',
    value: '156',
    icon: FaUsers,
    color: 'bg-green-500',
    role: 'support',
  },
];

function AnalyticsChart() {
  const { user } = useAuth();

  // Memoize stats based on user role
  const stats = useMemo(() => {
    return user?.role === 'admin' ? ADMIN_STATS : SUPPORT_STATS;
  }, [user?.role]);

  // Memoize total value
  const totalValue = useMemo(() => {
    return stats.reduce((sum, stat) => {
      const numValue = parseInt(stat.value.replace(/,/g, '')) || 0;
      return sum + numValue;
    }, 0);
  }, [stats]);

  if (!user) {
    return <div className="animate-pulse h-40 bg-gray-200 rounded-xl"></div>;
  }

  return (
    <div>
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Total: <span className="font-bold text-gray-900">{totalValue.toLocaleString()}</span>
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>
    </div>
  );
}

export default React.memo(AnalyticsChart);