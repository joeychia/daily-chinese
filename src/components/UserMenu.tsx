import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import styles from './UserMenu.module.css';

export const UserMenu = () => {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) return null;

  return (
    <div className={styles.container}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        title={user.displayName || user.email || '用户'}
      >
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || '用户头像'}
            className={styles.avatar}
          />
        ) : (
          <div className={styles.avatarPlaceholder}>
            {(user.displayName?.[0] || user.email?.[0] || '用').toUpperCase()}
          </div>
        )}
      </button>

      {isOpen && (
        <>
          <div className={styles.overlay} onClick={() => setIsOpen(false)} />
          <div className={styles.menu}>
            <div className={styles.userInfo}>
              {user.displayName && (
                <div className={styles.name}>{user.displayName}</div>
              )}
              {user.email && (
                <div className={styles.email}>{user.email}</div>
              )}
            </div>
            <button
              className={styles.signOutButton}
              onClick={handleSignOut}
            >
              退出登录
            </button>
          </div>
        </>
      )}
    </div>
  );
}; 