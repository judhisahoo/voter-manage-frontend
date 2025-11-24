'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/context/AuthContext';
import { apiClient } from '@/app/lib/secureAxios';
import { FaPlus, FaEdit, FaTrash, FaBan, FaCheck } from 'react-icons/fa';

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'support';
  status: 'active' | 'blocked';
  lastLogin?: string;
  createdAt?: string;
}

interface FormData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'support';
}

export default function UsersPage() {
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  
  // State Management
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    role: 'support',
  });

  // Protect route - admin only
  useEffect(() => {
    if (!authLoading && (!isAuthenticated || currentUser?.role !== 'admin')) {
      router.push('/dashboard');
    } else if (isAuthenticated && currentUser?.role === 'admin') {
      fetchUsers();
    }
  }, [isAuthenticated, authLoading, currentUser?.role, router]);

  // Fetch users from API
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiClient.get<User[]>('/users');
      setUsers(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to fetch users';
      setError(errorMsg);
      console.error('Fetch users error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Open add user modal
  const handleAddUser = useCallback(() => {
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'support',
    });
    setError(null);
    setShowModal(true);
  }, []);

  // Open edit user modal
  const handleEditUser = useCallback((u: User) => {
    setSelectedUser(u);
    setFormData({
      name: u.name,
      email: u.email,
      password: '',
      role: u.role,
    });
    setError(null);
    setShowModal(true);
  }, []);

  // Submit form (add or update)
  const handleSubmit = useCallback(async () => {
    // Validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Invalid email format');
      return;
    }
    if (!selectedUser && !formData.password) {
      setError('Password is required for new users');
      return;
    }
    if (formData.password && formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (selectedUser) {
        // Update existing user
        await apiClient.put(`/users/${selectedUser._id}`, formData);
        setSuccessMessage('User updated successfully!');
      } else {
        // Create new user
        await apiClient.post('/users', formData);
        setSuccessMessage('User created successfully!');
      }

      // Refresh users list
      await fetchUsers();
      
      // Close modal and reset form
      setShowModal(false);
      setSelectedUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'support',
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to save user';
      setError(errorMsg);
      console.error('Submit error:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, selectedUser, fetchUsers]);

  // Delete user
  const handleDeleteUser = useCallback(
    async (userId: string, userName: string) => {
      if (!confirm(`Are you sure you want to delete user "${userName}"? This action cannot be undone.`)) {
        return;
      }

      try {
        setError(null);
        await apiClient.delete(`/users/${userId}`);
        setSuccessMessage('User deleted successfully!');
        setUsers(users.filter(u => u._id !== userId));
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err: any) {
        const errorMsg = err.message || 'Failed to delete user';
        setError(errorMsg);
        console.error('Delete error:', err);
      }
    },
    [users]
  );

  // Toggle user block/unblock status
  const handleToggleStatus = useCallback(
    async (userId: string, currentStatus: string, userName: string) => {
      const action = currentStatus === 'active' ? 'block' : 'unblock';
      if (!confirm(`Are you sure you want to ${action} user "${userName}"?`)) {
        return;
      }

      try {
        setError(null);
        const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
        await apiClient.patch(`/users/${userId}/status`, {
          status: newStatus,
        });
        setSuccessMessage(`User ${action}ed successfully!`);
        
        // Update local state
        setUsers(
          users.map(u =>
            u._id === userId ? { ...u, status: newStatus as 'active' | 'blocked' } : u
          )
        );
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err: any) {
        const errorMsg = err.message || `Failed to ${action} user`;
        setError(errorMsg);
        console.error('Status toggle error:', err);
      }
    },
    [users]
  );

  // Close modal
  const handleCloseModal = useCallback(() => {
    setShowModal(false);
    setSelectedUser(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'support',
    });
    setError(null);
  }, []);

  // Don't render if not authenticated as admin
  if (!isAuthenticated || currentUser?.role !== 'admin') {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-500 mt-1">Manage system users and permissions</p>
        </div>
        <button
          onClick={handleAddUser}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition flex items-center gap-2 w-full md:w-auto justify-center"
        >
          <FaPlus />
          Add User
        </button>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{successMessage}</span>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-green-600 hover:text-green-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="text-gray-500 mt-4">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500">No users found</p>
            <button
              onClick={handleAddUser}
              className="mt-4 text-indigo-600 hover:text-indigo-700 font-semibold"
            >
              Add the first user
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-medium text-gray-800">
                      {u.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          u.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {u.status.charAt(0).toUpperCase() + u.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {u.lastLogin
                        ? new Date(u.lastLogin).toLocaleDateString()
                        : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex gap-2 flex-wrap">
                        {/* Edit Button */}
                        <button
                          onClick={() => handleEditUser(u)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded transition"
                          title="Edit user"
                        >
                          <FaEdit size={16} />
                        </button>

                        {/* Block/Unblock Button */}
                        <button
                          onClick={() => handleToggleStatus(u._id, u.status, u.name)}
                          className={`p-2 rounded transition ${
                            u.status === 'active'
                              ? 'text-orange-600 hover:text-orange-800 hover:bg-orange-50'
                              : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                          }`}
                          title={u.status === 'active' ? 'Block user' : 'Unblock user'}
                        >
                          {u.status === 'active' ? (
                            <FaBan size={16} />
                          ) : (
                            <FaCheck size={16} />
                          )}
                        </button>

                        {/* Delete Button */}
                        <button
                          onClick={() => handleDeleteUser(u._id, u.name)}
                          className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded transition"
                          title="Delete user"
                        >
                          <FaTrash size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-screen overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">
                {selectedUser ? 'Edit User' : 'Add New User'}
              </h2>
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* Name Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  disabled={isSubmitting || !!selectedUser}
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                  {selectedUser && (
                    <span className="text-xs text-gray-500 font-normal ml-2">
                      (leave blank to keep current)
                    </span>
                  )}
                  {!selectedUser && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="password"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={selectedUser ? 'Leave blank to keep current' : 'Enter password'}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  disabled={isSubmitting}
                />
              </div>

              {/* Role Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({...formData, role: e.target.value as 'admin' | 'support'})
                  }
                  disabled={isSubmitting}
                >
                  <option value="support">Support User</option>
                  <option value="admin">Admin User</option>
                </select>
              </div>

              {/* Error Message in Modal */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-3 py-2 rounded-lg text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-6 py-4 flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? 'Saving...'
                  : selectedUser
                  ? 'Update User'
                  : 'Create User'}
              </button>
              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}