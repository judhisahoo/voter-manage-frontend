'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import DashboardLayout from '@/app/components/DashboardLayout';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import LoadingSpinner from '@/app/components/LoadingSpinner';

// Lazy load the data list content component
const DataListContent = dynamic(
  () => import('@/app/components/DataListContent'),
  {
    loading: () => (
      <div className="bg-white rounded-xl shadow-md p-8">
        <div className="space-y-4">
          {/* Skeleton loaders */}
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    ),
    ssr: true,
  }
);

export default function DataListPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  // Protect route - redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/voter-data-manage-login');
    }
  }, [isAuthenticated, authLoading, router]);

  // Show loading spinner while checking authentication
  if (authLoading) {
    return <LoadingSpinner />;
  }

  // Don't render if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="h-10 bg-gray-200 rounded animate-pulse w-1/3"></div>
          <div className="bg-white rounded-xl shadow-md p-8">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </div>
      }
    >
      <DataListContent />
    </Suspense>
  );
}