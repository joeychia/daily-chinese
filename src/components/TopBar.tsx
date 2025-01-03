import React from 'react';
import { StreakDisplay } from './StreakDisplay';
import styles from './TopBar.module.css';

interface TopBarProps {
  onMenuClick: () => void;
  onThemeClick: () => void;
  themeEmoji: string;
  refreshTrigger?: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  onMenuClick,
  onThemeClick,
  themeEmoji,
  refreshTrigger
}) => {
  return (
    <div className={styles.topBar}>
      <button 
        className={styles.menuButton} 
        onClick={onMenuClick}
        title="菜单"
      >
        ☰
      </button>
      <div className={styles.streakContainer}>
        <StreakDisplay refreshTrigger={refreshTrigger} />
      </div>
      <button 
        className={styles.themeButton} 
        onClick={onThemeClick}
        title="更换主题"
      >
        {themeEmoji}
      </button>
    </div>
  );
}; 