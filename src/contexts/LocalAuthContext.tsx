import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../lib/localDatabase';
import { localAuthService } from '../services/localAuth';
import { localAdminService } from '../services/localAdmin';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        await localAuthService.init();
        const currentUser = localAuthService.getCurrentUser();
        setUser(currentUser);
        
        if (currentUser) {
          const adminStatus = await localAdminService.isAdmin(currentUser.id);
          setIsAdmin(adminStatus);
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { unsubscribe } = localAuthService.onAuthStateChange(async (user) => {
      setUser(user);
      
      if (user) {
        const adminStatus = await localAdminService.isAdmin(user.id);
        setIsAdmin(adminStatus);
      } else {
        setIsAdmin(false);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { user: loggedInUser } = await localAuthService.login({ email, password });
    if (loggedInUser) {
      const adminStatus = await localAdminService.isAdmin(loggedInUser.id);
      setIsAdmin(adminStatus);
    }
  };

  const register = async (data: any) => {
    await localAuthService.register(data);
  };

  const logout = async () => {
    await localAuthService.logout();
    setIsAdmin(false);
  };

  const resetPassword = async (email: string) => {
    await localAuthService.resetPassword(email);
  };

  const value = {
    user,
    isAdmin,
    loading,
    login,
    register,
    logout,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};