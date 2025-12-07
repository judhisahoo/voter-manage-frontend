'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { FaSearch, FaUser, FaShieldAlt, FaDatabase } from 'react-icons/fa';
import { useLanguage } from '@/app/context/LanguageContext';
import { apiClient } from '@/app/lib/secureAxios';

interface Activity {
  id: string;
  type: 'search' | 'user' | 'security' | 'data';
  description: string;
  timestamp: string;
}

const ActivityIcon = ({ type }: { type: string }) => {
  const iconClass = 'w-5 h-5';
  
  switch (type) {
    case 'search':
      return <FaSearch className={`${iconClass} text-blue-500`} />;
    case 'user':
      return <FaUser className={`${iconClass} text-green-500`} />;
    case 'security':
      return <FaShieldAlt className={`${iconClass} text-yellow-500`} />;
    case 'data':
      return <FaDatabase className={`${iconClass} text-purple-500`} />;
    default:
      return <FaSearch className={`${iconClass} text-gray-500`} />;
  }
};

export default function RecentActivity() {
  const { t } = useLanguage();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch activities from API
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        // Replace with actual API endpoint
        const mockActivities: Activity[] = [
          {
            id: '1',
            type: 'search',
            description: t('dashboard.searchedVoters'),
            timestamp: new Date().toISOString(),
          },
          {
            id: '2',
            type: 'user',
            description: t('dashboard.addedNewUser'),
            timestamp: new Date(Date.now() - 3600000).toISOString(),
          },
          {
            id: '3',
            type: 'security',
            description: t('dashboard.passwordChanged'),
            timestamp: new Date(Date.now() - 86400000).toISOString(),
          },
          {
            id: '4',
            type: 'data',
            description: t('dashboard.updatedVoterDatabase'),
            timestamp: new Date(Date.now() - 172800000).toISOString(),
          },
        ];

        // Uncomment when API is ready:
        // const data = await apiClient.get<Activity[]>('/activities');
        // setActivities(data);

        setActivities(mockActivities);
      } catch (err: any) {
        setError(err.message || t('dashboard.failedToFetchActivities'));
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  // Memoize formatted activities
  const formattedActivities = useMemo(() => {
    return activities.map((activity) => ({
      ...activity,
      formattedTime: new Date(activity.timestamp).toLocaleString(),
    }));
  }, [activities]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-red-600">{t('dashboard.errorLoadingActivities')}: {error}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">{t('dashboard.recentActivity')}</h2>
      <div className="space-y-4">
        {formattedActivities.length > 0 ? (
          formattedActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 pb-4 border-b last:border-b-0">
              <div className="p-2 rounded-full bg-gray-100 flex-shrink-0">
                <ActivityIcon type={activity.type} />
              </div>
              <div className="flex-grow">
                <p className="text-sm font-medium text-gray-900">
                  {activity.description}
                </p>
                <p className="text-xs text-gray-500">{activity.formattedTime}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center py-4">{t('dashboard.noActivitiesYet')}</p>
        )}
      </div>
    </div>
  );
}