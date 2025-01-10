/**
 * Menu Component Requirements
 * 
 * Features:
 * 1. Navigation:
 *    - Home link
 *    - Articles list
 *    - Progress tracking
 *    - Word bank
 *    - Feedback
 * 
 * 2. User Management:
 *    - Display user profile via UserMenu
 *    - Show user's name before dropdown
 *    - Handle authentication state
 *    - Proper color contrast for text
 * 
 * 3. Responsive Design:
 *    - Mobile-friendly layout
 *    - Collapsible menu on small screens
 *    - Touch-friendly targets
 * 
 * 4. Theme Integration:
 *    - Consistent with app theme
 *    - Proper color variables usage
 *    - Visual feedback on interactions
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { UserMenu } from './UserMenu';
import styles from './Menu.module.css';

interface MenuProps {
  /** Whether the menu is currently open */
  isOpen: boolean;
  /** Callback to close the menu */
  onClose: () => void;
}

export const Menu: React.FC<MenuProps> = ({ isOpen, onClose }): JSX.Element => {
  const handleFeedbackClick = (): void => {
    onClose();
  };

  return (
    <div className={`${styles.menu} ${isOpen ? styles.open : ''}`}>
      <div className={styles.menuContent}>
        <div className={styles.header}>
          <div className={styles.logoSection}>
            <img src={`${import.meta.env.BASE_URL}rooster.png`} alt="Logo" className={styles.logo} />
            <h2>每日一读</h2>
          </div>
          <button 
            className={styles.closeButton} 
            onClick={onClose}
            aria-label="关闭菜单"
          >
            ×
          </button>
        </div>
        <div className={styles.authSection}>
          <UserMenu />
        </div>
        <nav>
          <Link to="/" onClick={onClose}>首页</Link>
          <Link to="/articles" onClick={onClose}>文章列表</Link>
          <Link to="/create-article" onClick={onClose}>创建文章</Link>
          <Link to="/wordbank" onClick={onClose}>生词本</Link>
          <Link to="/progress" onClick={onClose}>学习进度</Link>
          <a 
            href="https://docs.google.com/forms/d/e/1FAIpQLSdjIDOY5gif53bOwFd53I_F6IpC40CQl3AE4ROuxiAcfW4Y-g/viewform?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleFeedbackClick}
          >
            反馈
          </a>
        </nav>
      </div>
      <div className={styles.overlay} onClick={onClose}></div>
    </div>
  );
}; 