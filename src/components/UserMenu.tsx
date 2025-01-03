import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import styles from './UserMenu.module.css';

export const UserMenu: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleLogin = () => {
    navigate('/login');
  };

  const handleSignUp = () => {
    navigate('/login?signup=true');
  };

  const getDisplayName = () => {
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email;
    return user?.id;
  };

  const getInitial = () => {
    if (user?.displayName) return user.displayName[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return user?.id[0].toUpperCase();
  };

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.authButtons}>
          <button onClick={handleLogin} className={styles.loginButton}>
            登录
          </button>
          <button onClick={handleSignUp} className={styles.signUpButton}>
            注册
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <button 
        className={styles.trigger}
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
      >
        <div className={styles.userTrigger}>
          <div className={styles.avatar}>
            {getInitial()}
          </div>
          <div className={styles.userName}>
            {getDisplayName()}
          </div>
        </div>
      </button>

      {isDropdownOpen && (
        <>
          <div className={styles.overlay} onClick={() => setIsDropdownOpen(false)} />
          <div className={styles.dropdown}>
            <div className={styles.userInfo}>
              <div className={styles.avatar}>
                {getInitial()}
              </div>
              <div className={styles.details}>
                <div className={styles.name}>{getDisplayName()}</div>
                {user.email && <div className={styles.email}>{user.email}</div>}
              </div>
            </div>
            <div className={styles.dropdownDivider} />
            <button onClick={handleSignOut} className={styles.signOutButton}>
              退出登录
            </button>
          </div>
        </>
      )}
    </div>
  );
}; 