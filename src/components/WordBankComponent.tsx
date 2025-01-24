import React, { useState, useEffect } from 'react';
import { ChineseWord } from '../data/sampleText';
import { TestWordModal } from './TestWordModal';
import { PrintableCards } from './PrintableCards';
import { getCharacterMastery, updateCharacterMastery } from '../services/userDataService';
import { rewardsService } from '../services/rewardsService';
import { useAuth } from '../contexts/AuthContext';
import { ref, get } from 'firebase/database';
import { db } from '../config/firebase';
import styles from './WordBankComponent.module.css';

export interface WordBankComponentProps {
  words: ChineseWord[];
  title: string;
  showSavedIndicator?: boolean;
  onWordDelete?: (word: ChineseWord) => void;
  onPointsUpdate?: () => void;
}

export const WordBankComponent: React.FC<WordBankComponentProps> = ({
  words,
  title,
  showSavedIndicator = false,
  onWordDelete,
  onPointsUpdate
}) => {
  const { user } = useAuth();
  const [selectedWord, setSelectedWord] = useState<ChineseWord | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [masteryData, setMasteryData] = useState<Record<string, number>>({});
  const [testedToday, setTestedToday] = useState<Record<string, boolean>>({});

  // Load mastery data and test dates
  useEffect(() => {
    const loadData = async () => {
      try {
        const [mastery, testDates] = await Promise.all([
          getCharacterMastery(),
          user ? get(ref(db, `users/${user.id}/wordTests`)) : null
        ]);
        
        setMasteryData(mastery || {});
        
        if (testDates && testDates.exists()) {
          const today = new Date().toISOString().split('T')[0];
          const tested: Record<string, boolean> = {};
          const dates = testDates.val();
          
          Object.entries(dates).forEach(([word, date]) => {
            tested[word] = date === today;
          });
          
          setTestedToday(tested);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [user]);

  const handleWordClick = (word: ChineseWord) => {
    setSelectedWord(word);
    setShowTestModal(true);
  };

  const handleTestCorrect = async () => {
    if (!selectedWord || !user) return;

    const currentMastery = masteryData[selectedWord.characters] ?? -1;
    const newMastery = currentMastery + 1;

    try {
      // Update mastery and record test completion for points
      await Promise.all([
        updateCharacterMastery(selectedWord.characters, newMastery),
        rewardsService.recordWordBankTest(user.id, selectedWord.characters)
      ]);

      // Update local state
      setMasteryData(prev => ({
        ...prev,
        [selectedWord.characters]: newMastery
      }));
      
      setTestedToday(prev => ({
        ...prev,
        [selectedWord.characters]: true
      }));

      // Call onPointsUpdate after points are awarded
      await rewardsService.addPoints(user.id, 1, 'wordBank');
      onPointsUpdate?.();

      // Remove word if mastery level reaches 3
      if (newMastery >= 3) {
        onWordDelete?.(selectedWord);
      }
    } catch (error) {
      console.error('Error updating test results:', error);
    }

    // Close modal after successful test
    setSelectedWord(null);
    setShowTestModal(false);
  };

  const handleCloseModal = () => {
    setSelectedWord(null);
    setShowTestModal(false);
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
    setTimeout(() => {
      window.print();
      setShowPrintPreview(false);
    }, 100);
  };

  const getMasteryColor = (mastery: number) => {
    switch (mastery) {
      case 0: return '#F56C6C'; // red
      case 1: return '#E6A23C'; // orange
      case 2: return '#F4E04D'; // yellow
      case 3: return '#67C23A'; // green
      default: return '#909399';
    }
  };

  return (
    <div className={styles.wordBankContainer}>
      <div className={styles.header}>
        <h2>{title}</h2>
        {showSavedIndicator && <span className={styles.savedIndicator}>已保存</span>}
      </div>
      <div className={styles.wordList}>
        {words.map((word) => {
          const mastery = masteryData[word.characters] ?? 0;
          const tested = testedToday[word.characters];
          return (
            <div 
              key={word.characters} 
              className={styles.wordItem}
              style={{ backgroundColor: tested ? '#f5f7fa' : undefined }}
            >
              <div className={styles.wordContent} onClick={() => handleWordClick(word)}>
                <span 
                  className={styles.characters}
                  style={{ color: getMasteryColor(mastery) }}
                >
                  {word.characters}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {words.length > 0 && (
        <button className={styles.printButton} onClick={handlePrint}>
          打印生词卡
        </button>
      )}
      <TestWordModal
        word={selectedWord}
        isOpen={showTestModal}
        onClose={handleCloseModal}
        onCorrect={handleTestCorrect}
        mastery={selectedWord ? (masteryData[selectedWord.characters] ?? 0) : 0}
      />
      {showPrintPreview && <PrintableCards words={words} />}
    </div>
  );
}; 