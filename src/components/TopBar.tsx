import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getWordBank, subscribeToWordBank } from '../services/userDataService';
import { ChineseWord } from '../data/sampleText';
import { StreakDisplay } from './StreakDisplay';
import styles from './TopBar.module.css';

interface TopBarProps {
  onMenuClick: () => void;
  onThemeClick: () => void;
  themeEmoji: string;
  refreshTrigger: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  onMenuClick,
  onThemeClick,
  themeEmoji,
  refreshTrigger
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setWordCount(0);
      return;
    }

    const loadWordBank = async () => {
      try {
        const words = await getWordBank(user.id);
        setWordCount(words.length);
      } catch (error) {
        console.error('Error loading word bank:', error);
      }
    };
    loadWordBank();

    const unsubscribe = subscribeToWordBank(user.id, (words: ChineseWord[]) => {
      setWordCount(words.length);
    });

    return () => {
      unsubscribe();
    };
  }, [user, refreshTrigger]);

  const handleWordBankClick = () => {
    navigate('/wordbank');
  };

  return (
    <div className={styles.topBar}>
      <div className={styles.leftSection}>
        <button className={styles.menuButton} onClick={onMenuClick}>
          ☰
        </button>
      </div>
      <div className={styles.rightSection}>
        <StreakDisplay />
        <button className={styles.wordBankButton} onClick={handleWordBankClick} title="生词本">
          📝 <span className={styles.count}>{wordCount}</span>
        </button>
        <button className={styles.themeButton} onClick={onThemeClick}>
          {themeEmoji}
        </button>
      </div>
    </div>
  );
}; 