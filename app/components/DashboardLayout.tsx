'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Cookies from 'js-cookie';
import { 
  FaHome, 
  FaSearch, 
  FaUsers, 
  FaUser, 
  FaSignOutAlt,
  FaDatabase,
  FaUserShield,
  FaBars,
  FaTimes,
  FaLock
} from 'react-icons/fa';
import { useAuth } from '@/app/context/AuthContext';

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout, isAuthenticated } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Handle mobile menu
  useEffect(() => {
    const handleResize = () => {
      const isMobileScreen = window.innerWidth < 768;
      setIsMobile(isMobileScreen);
      // Open sidebar on desktop, hide on mobile
      setSidebarOpen(!isMobileScreen);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Don't show layout on login page
  if (pathname === '/voter-data-manage-login' || !isAuthenticated) {
    return <>{children}</>;
  }

  const navItems = user?.role === 'admin'
    ? [
        { label: 'Dashboard', path: '/dashboard', icon: FaHome },
        { label: 'Search', path: '/search', icon: FaSearch },
        { label: 'Data List', path: '/data-list', icon: FaDatabase },
        { label: 'Manage Users', path: '/users', icon: FaUserShield },
        { label: 'Profile', path: '/profile', icon: FaUser },
        { label: 'Change Password', path: '/profile/change-password', icon: FaLock }
      ]
    : [
        { label: 'Dashboard', path: '/dashboard', icon: FaHome },
        { label: 'Search', path: '/search', icon: FaSearch },
        { label: 'Data List', path: '/data-list', icon: FaDatabase },
        { label: 'Profile', path: '/profile', icon: FaUser },
        { label: 'Change Password', path: '/profile/change-password', icon: FaLock }
      ];

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      logout();
    }
  };

  const handleNavClick = (path: string) => {
    router.push(path);
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="fixed top-4 left-4 z-50 md:hidden bg-indigo-600 text-white p-2 rounded-lg"
      >
        {sidebarOpen ? <FaTimes size={24} /> : <FaBars size={24} />}
      </button>

      {/* Sidebar Overlay */}
      {sidebarOpen && isMobile && (
        <div
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          isMobile
            ? `fixed top-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 z-40`
            : 'relative z-0'
        } w-64 h-screen bg-white shadow-lg flex flex-col`}
      >
          {/* Logo */}
          <div className="p-6 border-b">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-600 p-2 rounded-lg">
                <FaUserShield className="text-white text-2xl" />
              </div>
              <div>
                <h2 className="font-bold text-gray-800">Voter System</h2>
                <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const isActive = pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <item.icon className="text-xl" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Logout Button */}
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
      <div className="flex-1 overflow-auto">
        <div className="p-4 md:p-8 mt-12 md:mt-0">
          {children}
        </div>
      </div>
    </div>
  );
}