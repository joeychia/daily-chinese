import React from 'react';

interface AuthUser {
  uid: string;
  email: string | null;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const mockAuthContext: AuthContextType = {
  user: null,
  loading: false,
  signInWithGoogle: jest.fn(),
  signOut: jest.fn()
};

export const AuthContext = React.createContext<AuthContextType>(mockAuthContext);

export const useAuth = () => React.useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AuthContext.Provider value={mockAuthContext}>
      {children}
    </AuthContext.Provider>
  );
}; 