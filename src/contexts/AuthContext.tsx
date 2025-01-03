import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, AuthUser } from '../services/authService';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Initializing...');
    // Subscribe to auth state changes
    const unsubscribe = authService.onAuthStateChanged((user) => {
      console.log('AuthProvider: Auth state changed', { user });
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription
    return () => {
      console.log('AuthProvider: Cleaning up subscription');
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
      console.log('AuthProvider: Signing in with Google...');
      const user = await authService.signInWithGoogle();
      console.log('AuthProvider: Google sign in successful', { user });
      setUser(user);
    } catch (error) {
      console.error('AuthProvider: Error signing in with Google:', error);
      throw error;
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      console.log('AuthProvider: Signing in with email...');
      const user = await authService.signInWithEmail(email, password);
      console.log('AuthProvider: Email sign in successful', { user });
      setUser(user);
    } catch (error) {
      console.error('AuthProvider: Error signing in with email:', error);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    try {
      console.log('AuthProvider: Signing up with email...');
      const user = await authService.signUpWithEmail(email, password);
      console.log('AuthProvider: Email sign up successful', { user });
      setUser(user);
    } catch (error) {
      console.error('AuthProvider: Error signing up with email:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthProvider: Signing out...');
      await authService.signOut();
      console.log('AuthProvider: Sign out successful');
      setUser(null);
    } catch (error) {
      console.error('AuthProvider: Error signing out:', error);
      throw error;
    }
  };

  console.log('AuthProvider: Rendering with state:', { user, loading });

  const value = {
    user,
    loading,
    signInWithGoogle,
    signInWithEmail,
    signUpWithEmail,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 