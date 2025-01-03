import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import styles from './UserMenu.module.css';

export const UserMenu: React.FC = () => {
  const { user } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className={styles.menu}>
      <div className={styles.userInfo}>
        <div className={styles.avatar}>
          {user.id.charAt(0).toUpperCase()}
        </div>
        <div className={styles.details}>
          <div className={styles.name}>{user.id}</div>
        </div>
      </div>
      <button onClick={handleSignOut} className={styles.signOutButton}>
        退出登录
      </button>
    </div>
  );
}; 