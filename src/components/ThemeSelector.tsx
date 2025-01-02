import { Theme, themes } from '../config/themes';
import styles from './ThemeSelector.module.css';

interface ThemeSelectorProps {
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentTheme,
  onThemeChange,
}) => {
  return (
    <div className={styles.themeSelector}>
      <h3 className={styles.title}>主题选择</h3>
      <div className={styles.themeGrid}>
        {themes.map((theme) => (
          <button
            key={theme.id}
            className={`${styles.themeButton} ${
              currentTheme === theme.id ? styles.active : ''
            } ${theme.isLocked ? styles.locked : ''}`}
            onClick={() => !theme.isLocked && onThemeChange(theme.id)}
            style={{
              '--theme-primary': theme.colors.primary,
              '--theme-secondary': theme.colors.secondary,
              '--theme-background': theme.colors.background,
            } as React.CSSProperties}
          >
            <span className={styles.emoji}>{theme.emoji}</span>
            <span className={styles.name}>{theme.name}</span>
            {theme.isLocked && (
              <span className={styles.lockIcon}>🔒</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}; 