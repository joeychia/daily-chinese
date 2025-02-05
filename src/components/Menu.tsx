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

import React, { useEffect, useState } from 'react';
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
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(false);
      return;
    }

    if (isIOS || isSafari) {
      setShowInstallButton(true);
    } else {
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
        setShowInstallButton(true);
      });
    }
  }, [isIOS, isSafari]);

  const handleInstall = async () => {
    if (isIOS || isSafari) {
      const message = 'To install this app:\n1. Tap the Share button in your browser (square with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to confirm';
      alert(message);
    } else if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setShowInstallButton(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error('Install prompt error:', err);
      }
    }
    onClose();
  };

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
          <Link to="/" onClick={onClose}>
            <span>首页 <span className={styles.englishLabel}>Home</span></span>
          </Link>
          <Link to="/articles" onClick={onClose}>
            <span>文章列表 <span className={styles.englishLabel}>Articles</span></span>
          </Link>
          <Link to="/create-article" onClick={onClose}>
            <span>创建文章 <span className={styles.englishLabel}>Create Article</span></span>
          </Link>
          <Link to="/wordbank" onClick={onClose}>
            <span>生词本 <span className={styles.englishLabel}>Word Bank</span></span>
          </Link>
          <Link to="/progress" onClick={onClose}>
            <span>学习进度 <span className={styles.englishLabel}>Progress</span></span>
          </Link>
          <Link to="/leaderboard" onClick={onClose}>
            <span>排行榜 <span className={styles.englishLabel}>Leaderboard</span></span>
          </Link>
          {showInstallButton && (
            <button onClick={handleInstall} className={styles.installButton}>
              <span>
                {isIOS ? '安装应用 ' : '安装应用 '}
                <span className={styles.englishLabel}>
                  {isIOS ? 'Install' : 'Install App'}
                </span>
              </span>
            </button>
          )}
          <a 
            href="https://docs.google.com/forms/d/e/1FAIpQLSdjIDOY5gif53bOwFd53I_F6IpC40CQl3AE4ROuxiAcfW4Y-g/viewform?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleFeedbackClick}
          >
            <span>反馈 <span className={styles.englishLabel}>Feedback</span></span>
          </a>
        </nav>
      </div>
      <div className={styles.overlay} onClick={onClose}></div>
    </div>
  );
};