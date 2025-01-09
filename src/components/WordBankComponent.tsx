import React, { useState, useEffect } from 'react';
import { ChineseWord } from '../data/sampleText';
import { TestWordModal } from './TestWordModal';
import { PrintableCards } from './PrintableCards';
import { getCharacterMastery, updateCharacterMastery } from '../services/userDataService';
import styles from './WordBankComponent.module.css';

export interface WordBankComponentProps {
  words: ChineseWord[];
  title: string;
  showSavedIndicator?: boolean;
  onWordDelete?: (word: ChineseWord) => void;
}

export const WordBankComponent: React.FC<WordBankComponentProps> = ({
  words,
  title,
  showSavedIndicator = false,
  onWordDelete
}) => {
  const [selectedWord, setSelectedWord] = useState<ChineseWord | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [masteryData, setMasteryData] = useState<Record<string, number>>({});

  // Load mastery data
  useEffect(() => {
    const loadMasteryData = async () => {
      try {
        const data = await getCharacterMastery();
        setMasteryData(data || {});
      } catch (error) {
        console.error('Error loading mastery data:', error);
      }
    };

    loadMasteryData();
  }, []);

  const handleWordClick = (word: ChineseWord) => {
    setSelectedWord(word);
    setShowTestModal(true);
  };

  const handleTestCorrect = async () => {
    if (!selectedWord) return;

    const currentMastery = masteryData[selectedWord.characters] ?? -1;
    const newMastery = currentMastery + 1;

    // Update mastery data locally and in storage
    const newMasteryData = {
      ...masteryData,
      [selectedWord.characters]: newMastery
    };
    setMasteryData(newMasteryData);
    await updateCharacterMastery(selectedWord.characters, newMastery);

    // Only close and remove if mastery is >= 3
    if (newMastery >= 3) {
      onWordDelete?.(selectedWord);
      setSelectedWord(null);
      setShowTestModal(false);
    }
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

  return (
    <div className={styles.wordBankContainer}>
      <div className={styles.header}>
        <h2>{title}</h2>
        {showSavedIndicator && <span className={styles.savedIndicator}>已保存</span>}
      </div>
      <div className={styles.wordList}>
        {words.map((word) => (
          <div 
            key={word.characters} 
            className={styles.wordItem}
            data-mastery={masteryData[word.characters] ?? -1}
          >
            <div className={styles.wordContent} onClick={() => handleWordClick(word)}>
              <span className={styles.characters}>{word.characters}</span>
            </div>
          </div>
        ))}
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
        mastery={selectedWord ? (masteryData[selectedWord.characters] ?? -1) : -1}
      />
      {showPrintPreview && <PrintableCards words={words} />}
    </div>
  );
}; 