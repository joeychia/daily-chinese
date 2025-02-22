/**
 * UserMenu Component Requirements
 * 
 * Features:
 * 1. Display user profile:
 *    - Show avatar (initial letter if no photo)
 *    - Show display name (fallback to email or user ID)
 *    - Show email in dropdown
 * 
 * 2. Name editing:
 *    - Allow editing display name
 *    - Validate empty name
 *    - Show error messages
 *    - Update UI immediately after successful change
 * 
 * 3. Authentication:
 *    - Show login/signup buttons when not logged in
 *    - Show logout button in dropdown when logged in
 *    - Handle auth state changes
 * 
 * 4. UI/UX:
 *    - Dropdown menu with smooth animation
 *    - Click outside to close
 *    - Keyboard support (Enter to save, Escape to cancel)
 *    - Loading and error states
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { signOut, updateProfile } from 'firebase/auth';
import { auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';
import styles from './UserMenu.module.css';

export const UserMenu: React.FC = () => {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newDisplayName, setNewDisplayName] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNewDisplayName(user?.displayName || '');
  }, [user?.displayName]);

  const handleSignOut = async (): Promise<void> => {
    try {
      await signOut(auth);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleLogin = (): void => {
    navigate('/login');
  };

  const handleSignUp = (): void => {
    navigate('/login?signup=true');
  };

  const getDisplayName = (): string => {
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email;
    return user?.id || '';
  };

  const getInitial = (): string => {
    if (user?.displayName) return user.displayName[0].toUpperCase();
    if (user?.email) return user.email[0].toUpperCase();
    return (user?.id?.[0] || '').toUpperCase();
  };

  const handleEditClick = (): void => {
    setIsEditing(true);
    setNewDisplayName(user?.displayName || '');
    setError(null);
  };

  const handleSaveDisplayName = async (): Promise<void> => {
    if (!auth.currentUser || !user) return;
    
    const trimmedName = newDisplayName.trim();
    if (!trimmedName) {
      setError('用户名不能为空');
      return;
    }
    
    try {
      await updateProfile(auth.currentUser, {
        displayName: trimmedName
      });
      
      // Create a new user object with updated display name
      const updatedUser = {
        ...user,
        displayName: trimmedName
      };
      setUser(updatedUser);
      setIsEditing(false);
      setError(null);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error updating display name:', error);
      setError('无法更新用户名，请重试');
    }
  };

  const handleCancelEdit = (): void => {
    setIsEditing(false);
    setError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === 'Enter') {
      handleSaveDisplayName();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
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
                {isEditing ? (
                  <div className={styles.editNameForm}>
                    <input
                      type="text"
                      value={newDisplayName}
                      onChange={(e) => setNewDisplayName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className={styles.editNameInput}
                      placeholder="输入新用户名"
                      autoFocus
                    />
                    {error && <div className={styles.error}>{error}</div>}
                    <div className={styles.editButtons}>
                      <button onClick={handleSaveDisplayName} className={styles.saveButton}>
                        保存
                      </button>
                      <button onClick={handleCancelEdit} className={styles.cancelButton}>
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.name}>
                      {getDisplayName()}
                      <button onClick={handleEditClick} className={styles.editButton}>
                        编辑
                      </button>
                    </div>
                    {user.email && <div className={styles.email}>{user.email}</div>}
                  </>
                )}
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