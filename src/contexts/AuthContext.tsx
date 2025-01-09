import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged, onIdTokenChanged } from 'firebase/auth';

interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  setUser: (user: AuthUser | null) => void;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  signIn: async () => {},
  signInWithGoogle: async () => {},
  signUp: async () => {},
  signOut: async () => {}
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribeAuthState = onAuthStateChanged(auth, (user) => {
      setUser(user ? {
        id: user.uid,
        email: user.email,
        displayName: user.displayName
      } : null);
      setLoading(false);
    });

    // Listen for token changes (which includes profile updates)
    const unsubscribeTokenChange = onIdTokenChanged(auth, (user) => {
      setUser(user ? {
        id: user.uid,
        email: user.email,
        displayName: user.displayName
      } : null);
    });

    return () => {
      unsubscribeAuthState();
      unsubscribeTokenChange();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      setUser,
      signIn: async () => {}, 
      signInWithGoogle: async () => {}, 
      signUp: async () => {}, 
      signOut: async () => {} 
    }}>
      {children}
    </AuthContext.Provider>
  );
}; 