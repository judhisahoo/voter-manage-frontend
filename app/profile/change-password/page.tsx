"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { useLanguage } from '@/app/context/LanguageContext';
import { FaLock } from 'react-icons/fa';
import { apiClient } from '../../lib/secureAxios';

export default function ChangePasswordPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/voter-data-manage-login');
    }
  }, [isAuthenticated, authLoading, router]);

  const handleChangePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: t('profile.passwordsDoNotMatch') });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: t('profile.passwordMinLength') });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      await apiClient.post('/users/change-password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      setMessage({ type: 'success', text: t('profile.passwordChanged') });
      setFormData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || t('profile.passwordChangeError') });
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">{t('profile.changePassword')}</h1>
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

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
          <FaLock className="text-indigo-600" />
          {t('profile.changePassword')}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.currentPassword')}</label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.newPassword')}</label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('profile.confirmPassword')}</label>
            <input
              type="password"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            />
          </div>

          <button
            onClick={handleChangePassword}
            disabled={loading}
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? t('profile.saving') : t('profile.updatePassword')}
          </button>
        </div>
      </div>
    </div>
  );
}
