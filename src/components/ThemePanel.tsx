import { useState, useEffect } from 'react';
import { ThemeSelector } from './ThemeSelector';
import styles from './ThemePanel.module.css';

interface ThemePanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: string;
  onThemeChange: (themeId: string) => void;
}

const FONT_SIZES = [
  { label: '小', value: '14px' },
  { label: '中', value: '16px' },
  { label: '大', value: '18px' },
  { label: '特大', value: '20px' },
];

export const ThemePanel: React.FC<ThemePanelProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onThemeChange
}) => {
  const [fontSize, setFontSize] = useState(() => {
    return localStorage.getItem('app-font-size') || '16px';
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--base-font-size', fontSize);
    localStorage.setItem('app-font-size', fontSize);
  }, [fontSize]);

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
          <h3>主题设置</h3>
          <button className={styles.closeButton} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.content}>
          <div className={styles.section}>
            <h4>字体大小</h4>
            <div className={styles.fontSizeControls}>
              {FONT_SIZES.map(({ label, value }) => (
                <button
                  key={value}
                  className={`${styles.fontSizeButton} ${fontSize === value ? styles.active : ''}`}
                  onClick={() => setFontSize(value)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className={styles.section}>
            <h4>主题选择</h4>
            <ThemeSelector
              currentTheme={currentTheme}
              onThemeChange={handleThemeSelect}
            />
          </div>
        </div>
      </div>
    </>
  );
}; 