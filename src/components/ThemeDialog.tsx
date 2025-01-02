import { ThemeSelector } from './ThemeSelector';
import styles from './ThemeDialog.module.css';

interface ThemeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
}

export const ThemeDialog: React.FC<ThemeDialogProps> = ({
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
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.dialog} onClick={e => e.stopPropagation()}>
        <button className={styles.closeButton} onClick={onClose}>
          ✕
        </button>
        <ThemeSelector
          currentTheme={currentTheme}
          onThemeChange={handleThemeSelect}
        />
      </div>
    </div>
  );
}; 