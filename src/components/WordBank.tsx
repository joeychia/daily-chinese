import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChineseWord } from '../data/sampleText';
import { getWordBank, subscribeToWordBank, saveWordBank, getTheme } from '../services/userDataService';
import { WordBankComponent } from './WordBankComponent';
import { themes } from '../config/themes';
import styles from './WordBank.module.css';

export const WordBank: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [wordBank, setWordBank] = useState<ChineseWord[]>([]);
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const [currentTheme, setCurrentTheme] = useState('candy');

  // Load theme
  useEffect(() => {
    if (!user) {
      setCurrentTheme('candy');
      return;
    }

    const loadTheme = async () => {
      try {
        const theme = await getTheme(user.id);
        if (theme) {
          setCurrentTheme(theme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();
  }, [user]);

  useEffect(() => {
    if (!user) {
      setWordBank([]);
      return;
    }

    const loadWordBank = async () => {
      try {
        const words = await getWordBank(user.id);
        setWordBank(words);
      } catch (error) {
        console.error('Error loading word bank:', error);
      }
    };
    loadWordBank();

    const unsubscribe = subscribeToWordBank(user.id, (updatedWordBank: ChineseWord[]) => {
      setWordBank(updatedWordBank);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Setup word bank syncing
  useEffect(() => {
    if (!user) return;

    let syncTimeout: NodeJS.Timeout;
    const syncWordBank = async () => {
      try {
        await saveWordBank(user.id, wordBank);
        console.log('Word bank synced successfully:', {
          wordCount: wordBank.length,
          timestamp: new Date().toISOString()
        });
        
        // Show saved indicator for 5 seconds
        setShowSavedIndicator(true);
        setTimeout(() => {
          setShowSavedIndicator(false);
        }, 5000);
      } catch (error) {
        console.error('Error syncing word bank:', error);
      }
    };

    // Start periodic sync
    const syncInterval = setInterval(syncWordBank, 60000); // Sync every minute

    return () => {
      clearTimeout(syncTimeout);
      clearInterval(syncInterval);
    };
  }, [user, wordBank]);

  const handleDeleteWord = (word: ChineseWord) => {
    if (!user) return;
    const newWordBank = wordBank.filter(w => w.characters !== word.characters);
    setWordBank(newWordBank);
    saveWordBank(user.id, newWordBank).catch(error => {
      console.error('Error saving word bank:', error);
    });
  };

  const theme = themes.find(t => t.id === currentTheme) || themes[0];

  return (
    <div className="content word-bank-page">
      <div className={styles.container} style={{
        background: theme.colors.background,
        color: theme.colors.text,
        '--theme-primary': theme.colors.primary,
        '--theme-secondary': theme.colors.secondary,
        '--theme-card-bg': theme.colors.cardBackground,
        '--theme-card-border': theme.colors.cardBorder,
        '--theme-highlight': theme.colors.highlight,
      } as React.CSSProperties}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate(-1)}>
            ←
          </button>
          <h1>我的生词本 ({wordBank.length})</h1>
        </div>
        <WordBankComponent
          words={wordBank}
          title="全部生词"
          onDeleteWord={handleDeleteWord}
          onWordToDelete={(_) => {}}
          showSavedIndicator={showSavedIndicator}
        />
      </div>
    </div>
  );
}; 