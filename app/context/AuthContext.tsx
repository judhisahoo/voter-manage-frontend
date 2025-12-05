'use client';

import React, { 
  createContext, 
  ReactNode, 
  useState, 
  useEffect, 
  useContext, 
  useCallback 
} from 'react';
import Cookies from 'js-cookie';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'support';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  updateUser: (userData: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Initialize auth on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const userData = Cookies.get('user');
        const token = Cookies.get('access_token');

        if (userData && token) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        }
      } catch (err) {
        console.error('Auth initialization failed:', err);
        Cookies.remove('user');
        Cookies.remove('access_token');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
          },
          body: JSON.stringify({ email, password }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      const { user: userData, access_token } = data;

      // Store securely
      Cookies.set('user', JSON.stringify(userData), {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });
      Cookies.set('access_token', access_token, {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      setUser(userData);
      return true;
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      console.error('Login error:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
    Cookies.remove('user');
    Cookies.remove('access_token');
    router.push('/voter-data-manage-login');
  }, [router]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateUser = useCallback((userData: any) => {
    // Map API response user object to User interface
    // API returns _id, but User interface expects id
    const updatedUser: User = {
      id: userData._id || userData.id,
      name: userData.name,
      email: userData.email,
      role: userData.role,
    };

    // Update state
    setUser(updatedUser);

    // Update cookie
    Cookies.set('user', JSON.stringify(updatedUser), {
      expires: 7,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
    clearError,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}