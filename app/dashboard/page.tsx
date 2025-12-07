'use client';

import dynamic from 'next/dynamic';
import { Suspense, useEffect } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { useRouter } from 'next/navigation';
import { trackPageMetrics } from '@/app/lib/performance';
import { useLanguage } from '@/app/context/LanguageContext';

// Lazy load heavy components
const AnalyticsChart = dynamic(() => import('@/app/components/AnalyticsChart'), {
  loading: () => <div className="animate-pulse h-40 bg-gray-200 rounded-xl"></div>,
  ssr: true,
});

const RecentActivity = dynamic(() => import('@/app/components/RecentActivity'), {
  loading: () => <div className="animate-pulse h-80 bg-gray-200 rounded-xl"></div>,
  ssr: true,
});

/*const DataList = dynamic(() => import('@/app/components/DataList'), {
  loading: () => <div className="animate-pulse h-96 bg-gray-200 rounded-xl"></div>,
  ssr: false,
});*/

export default function DashboardPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  // Track page performance
  useEffect(() => {
    trackPageMetrics();
  }, []);

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/voter-data-manage-login');
    }
  }, [isAuthenticated, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">
          {t('dashboard.welcomeBack')}, {user?.name}
        </h1>
        <p className="text-gray-500 mt-1">
          {t('dashboard.role')}: <span className="font-semibold capitalize">{t(`userManagement.${user?.role}`)}</span>
        </p>
      </div>

      {/* Analytics Section */}
      <Suspense fallback={<div className="animate-pulse h-40 bg-gray-200 rounded-xl"></div>}>
        <AnalyticsChart />
      </Suspense>

      {/* Recent Activity */}
      <Suspense fallback={<div className="animate-pulse h-80 bg-gray-200 rounded-xl"></div>}>
        <RecentActivity />
      </Suspense>

      {/* Data List */}
      <Suspense fallback={<div className="animate-pulse h-96 bg-gray-200 rounded-xl"></div>}>
        {/*<DataList />*/}
      </Suspense>
    </div>
  );
}