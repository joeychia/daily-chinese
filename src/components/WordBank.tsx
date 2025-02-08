import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ChineseWord } from '../data/sampleText';
import { getWordBank, subscribeToWordBank, saveWordBank, getTheme } from '../services/userDataService';
import { WordBankComponent } from './WordBankComponent';
import { themes } from '../config/themes';
import { getLocalStorageItem, setLocalStorageItem } from '../utils/localStorageUtils';

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
      const storedWordBank = getLocalStorageItem('guestWordBank') || [];
      setWordBank(storedWordBank);
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
        
        setShowSavedIndicator(true);
        setTimeout(() => {
          setShowSavedIndicator(false);
        }, 5000);
      } catch (error) {
        console.error('Error syncing word bank:', error);
      }
    };

    const syncInterval = setInterval(syncWordBank, 60000);

    return () => {
      clearTimeout(syncTimeout);
      clearInterval(syncInterval);
    };
  }, [user, wordBank]);

  // Sync word bank to localStorage for guest users
  useEffect(() => {
    if (!user) {
      setLocalStorageItem('guestWordBank', wordBank);
    }
  }, [wordBank, user]);

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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-yellow-50 to-blue-50 py-6 px-2">
      <div className="" style={{
        color: theme.colors.text,
        '--theme-primary': theme.colors.primary,
        '--theme-secondary': theme.colors.secondary,
        '--theme-card-bg': theme.colors.cardBackground,
        '--theme-card-border': theme.colors.cardBorder,
        '--theme-highlight': theme.colors.highlight,
        '--theme-text': theme.colors.text,
      } as React.CSSProperties}>
        <div className="flex items-center justify-between mb-8 w-full">
          <button 
            className="bg-transparent border-none text-2xl cursor-pointer p-2 transition-opacity duration-200 hover:opacity-80"
            onClick={() => navigate(-1)}
            style={{ color: 'var(--theme-text)' }}
          >
            ←
          </button>
          <h1 className="m-0 text-2xl text-center flex-grow">我的生词本 ({wordBank.length})</h1>
          {/* Empty div to balance the layout */}
          <div className="w-[42px]"></div>
        </div>
        <WordBankComponent
          words={wordBank}
          title="全部生词"
          showSavedIndicator={showSavedIndicator}
          onWordDelete={handleDeleteWord}
        />
      </div>
    </div>
  );
};