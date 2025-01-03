import { 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';

export interface AuthUser {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

const convertFirebaseUser = (user: User): AuthUser => ({
  id: user.uid,
  email: user.email,
  displayName: user.displayName,
  photoURL: user.photoURL
});

export const authService = {
  signInWithGoogle: async (): Promise<AuthUser> => {
    const result = await signInWithPopup(auth, googleProvider);
    return convertFirebaseUser(result.user);
  },

  signInWithEmail: async (email: string, password: string): Promise<AuthUser> => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return convertFirebaseUser(result.user);
  },

  signUpWithEmail: async (email: string, password: string): Promise<AuthUser> => {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return convertFirebaseUser(result.user);
  },

  signOut: async (): Promise<void> => {
    await signOut(auth);
  },

  getCurrentUser: (): Promise<AuthUser | null> => {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        if (user) {
          resolve(convertFirebaseUser(user));
        } else {
          resolve(null);
        }
      });
    });
  },

  onAuthStateChanged: (callback: (user: AuthUser | null) => void) => {
    return onAuthStateChanged(auth, (user) => {
      callback(user ? convertFirebaseUser(user) : null);
    });
  }
}; 