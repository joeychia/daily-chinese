import React, { useState, useEffect } from 'react';
import { ChineseWord } from '../data/sampleText';
import styles from './ChineseText.module.css';

interface ChineseTextProps {
  text: ChineseWord[];
  onWordPeek: (word: ChineseWord) => void;
  wordBank?: ChineseWord[];
}

interface SelectedWordInfo {
  word: ChineseWord;
  index: number;
}

export function ChineseText({ text, onWordPeek, wordBank = [] }: ChineseTextProps) {
  const [selectedWord, setSelectedWord] = useState<SelectedWordInfo | null>(null);

  const isInWordBank = (word: ChineseWord) => {
    return wordBank.some(w => w.characters === word.characters);
  };

  const isChineseCharacter = (str: string) => {
    return /[\u4E00-\u9FFF]/.test(str);
  };

  const handleWordClick = (word: ChineseWord, index: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event from bubbling

    if (isChineseCharacter(word.characters)) {
      if (selectedWord?.word === word && selectedWord?.index === index) {
        setSelectedWord(null);
      } else {
        setSelectedWord({ word, index });
        onWordPeek(word);
      }
    } 
  };

  // Add document-wide click listener to handle "click away"
  useEffect(() => {
    const handleDocumentClick = () => {
      if (selectedWord !== null) {
        setSelectedWord(null);
      }
    };

    document.addEventListener('click', handleDocumentClick);
    return () => {
      document.removeEventListener('click', handleDocumentClick);
    };
  }, [selectedWord]);

  return (
    <div className={styles.textContainer}>
      {text.map((word, index) => (
        <span
          key={index}
          className={`${styles.wordContainer} ${isChineseCharacter(word.characters) ? styles.interactive : ''}`}
          onClick={(e) => handleWordClick(word, index, e)}
        >
          {isInWordBank(word) && <span className={styles.wordBankDot} />}
          <span className={styles.word}>{word.characters}</span>
          {selectedWord?.word.characters === word.characters && selectedWord?.index === index && isChineseCharacter(word.characters) && (
            <div className={`${styles.pinyinPopup} ${styles.visible}`}>
              <div className={styles.pinyin}>{word.pinyin.join(' ')}</div>
            </div>
          )}
        </span>
      ))}
    </div>
  );
}

