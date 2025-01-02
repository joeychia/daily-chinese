import { ThemeSelector } from './ThemeSelector';
import styles from './ThemePanel.module.css';

interface ThemePanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
}

export const ThemePanel: React.FC<ThemePanelProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange
}) => {
  if (!isOpen) return null;

  const handleThemeSelect = (themeId: string) => {
    onThemeChange(themeId);
    onClose();
  };

  return (
    <>
      <div className={styles.overlay} onClick={onClose} />
      <div className={styles.panel}>
        <div className={styles.header}>
          <h3>主题选择</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.content}>
          <ThemeSelector
            currentTheme={currentTheme}
            onThemeChange={handleThemeSelect}
          />
        </div>
      </div>
    </>
  );
}; 