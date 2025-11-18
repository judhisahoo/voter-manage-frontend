// src/components/DashboardLayout.tsx
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { 
  FaHome, 
  FaSearch, 
  FaUsers, 
  FaShieldAlt, 
  FaUser, 
  FaSignOutAlt,
  FaDatabase
} from 'react-icons/fa';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const userData = Cookies.get('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const navItems = user?.role === 'admin'
    ? [
        { label: 'Dashboard', path: '/dashboard', icon: FaHome },
        { label: 'Search', path: '/search', icon: FaSearch },
        { label: 'Data List', path: '/data-list', icon: FaDatabase },
        { label: 'Manage Users', path: '/users', icon: FaShieldAlt },
        { label: 'Profile', path: '/profile', icon: FaUser }
      ]
    : [
        { label: 'Dashboard', path: '/dashboard', icon: FaHome },
        { label: 'Search', path: '/search', icon: FaSearch },
        { label: 'Data List', path: '/data-list', icon: FaDatabase },
        { label: 'Profile', path: '/profile', icon: FaUser }
      ];

  const handleLogout = () => {
    Cookies.remove('access_token');
    Cookies.remove('user');
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <FaShieldAlt className="text-white text-2xl" />
            </div>
            <div>
              <h2 className="font-bold text-gray-800">Voter System</h2>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                pathname === item.path
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon className="text-xl" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition"
          >
            <FaSignOutAlt className="text-xl" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 overflow-auto">
        {children}
      </div>
    </div>
  );
}