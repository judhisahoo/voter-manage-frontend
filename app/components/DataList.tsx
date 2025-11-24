'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/app/context/AuthContext';

// Lazy load the data list content
const DataListContent = dynamic(() => import('./DataListContent'), {
  loading: () => (
    <div className="bg-white rounded-xl shadow-md p-8">
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-200 rounded"></div>
        ))}
      </div>
    </div>
  ),
  ssr: true,
});

export default function DataList() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return <DataListContent />;
}