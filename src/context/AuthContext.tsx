import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '@/services/apiService';

interface UserProfile {
  display_name: string;
  bio: string;
  profile_image_url: string;
  budget_style: string;
  preferred_trip_length: number;
  favourite_destination: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  profile: UserProfile;
}

interface AuthContextType {
  currentUser: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  setCurrentUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  isAuthenticated: false,
  loading: true,
  setCurrentUser: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const data = await getCurrentUser();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error('Not authenticated');
      } finally {
        setLoading(false);
      }
    };
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, isAuthenticated: !!currentUser, loading, setCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
