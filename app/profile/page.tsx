'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { FaUser, FaSave } from 'react-icons/fa';
import { apiClient } from '../lib/secureAxios';

export default function ProfilePage() {
  const { user, isAuthenticated, loading: authLoading, logout, updateUser } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Protect route
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/voter-data-manage-login');
    } else if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
      }));
    }
  }, [isAuthenticated, authLoading, router, user]);

  const handleUpdateProfile = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Update profile logic
      if (!formData.name.trim()) {
        setMessage({type: 'error', text: t('profile.nameRequired')});
        return;
      }
      if (!formData.email.trim()) {
        setMessage({type: 'error', text: t('profile.emailRequired')});
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        setMessage({type: 'error', text: t('profile.invalidEmail')});
        return;
      }

      const response = await apiClient.put<{ message: string; user: any }>('/users/profile', {
        name: formData.name,
        email: formData.email,
      });
      
      // Update user in AuthContext with the response data
      if (response && response.user) {
        updateUser(response.user);
      }
      
      setMessage({ type: 'success', text: response?.message || t('profile.profileUpdateSuccess') });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || t('profile.profileUpdateError') });
    } finally {
      setLoading(false);
    }
  };

  // profile-only page; password management moved to `app/profile/change-password`

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">{t('profile.profileSettings')}</h1>
        <p className="text-gray-500 mt-1">{t('profile.manageAccount')}</p>
      </div>

      {message.text && (
        <div
          className={`px-4 py-3 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Profile Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FaUser className="text-indigo-600" />
          {t('profile.profileInformation')}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.fullName')}
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.emailAddress')}
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('profile.role')}
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 capitalize"
              value={user?.role || ''}
              disabled
            />
          </div>

          <button
            onClick={handleUpdateProfile}
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            <FaSave />
            {loading ? t('profile.saving') : t('profile.saveChanges')}
          </button>
        </div>
      </div>
      

      {/* Logout Section */}
      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{t('profile.dangerZone')}</h2>
        <button
          onClick={() => {
            if (confirm(t('common.confirmLogout'))) {
              logout();
            }
          }}
          className="bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition"
        >
          {t('profile.logout')}
        </button>
      </div>
    </div>
  );
}