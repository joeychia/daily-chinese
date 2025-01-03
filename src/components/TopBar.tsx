import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getWordBank, subscribeToWordBank } from '../services/userDataService';
import { ChineseWord } from '../data/sampleText';
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
      <button className={styles.menuButton} onClick={onMenuClick}>
        ☰
      </button>
      <div className={styles.title}>每日中文</div>
      <div className={styles.actions}>
        <button className={styles.wordBankButton} onClick={handleWordBankClick}>
          生词本
          {wordCount > 0 && <span className={styles.badge}>{wordCount}</span>}
        </button>
        <button className={styles.themeButton} onClick={onThemeClick}>
          {themeEmoji}
        </button>
      </div>
    </div>
  );
}; 