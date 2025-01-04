import React, { useState, useEffect, useRef } from 'react';
import { ChineseWord } from '../data/sampleText';
import styles from './ChineseText.module.css';

interface ChineseTextProps {
  text: ChineseWord[];
  onWordPeek: (word: ChineseWord) => void;
  wordBank?: ChineseWord[];
}

export function ChineseText({ text, onWordPeek, wordBank = [] }: ChineseTextProps) {
  const [touchedWord, setTouchedWord] = useState<ChineseWord | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const touchTimeout = useRef<number | null>(null);

  const isInWordBank = (word: ChineseWord) => {
    return wordBank.some(w => w.characters === word.characters);
  };

  const isChineseCharacter = (str: string) => {
    return /[\u4E00-\u9FFF]/.test(str);
  };

  const clearTouchTimeout = () => {
    if (touchTimeout.current !== null) {
      window.clearTimeout(touchTimeout.current);
      touchTimeout.current = null;
    }
  };

  const handleTouchStart = (e: React.TouchEvent, word: ChineseWord) => {
    if (!isChineseCharacter(word.characters)) return;
    
    setTouchStartY(e.touches[0].clientY);
    setTouchStartX(e.touches[0].clientX);
    
    clearTouchTimeout();
    touchTimeout.current = window.setTimeout(() => {
      if (!isDragging) {
        setTouchedWord(word);
      }
    }, 200);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null || touchStartX === null) return;
    
    const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
    const deltaX = Math.abs(e.touches[0].clientX - touchStartX);
    
    // If moved more than 5px in any direction, consider it a drag
    if (deltaY > 5 || deltaX > 5) {
      setIsDragging(true);
      setTouchedWord(null);
      clearTouchTimeout();
    }
  };

  const handleTouchEnd = (word: ChineseWord) => {
    clearTouchTimeout();

    if (!isChineseCharacter(word.characters) || isDragging) {
      setIsDragging(false);
      setTouchStartY(null);
      setTouchStartX(null);
      return;
    }

    if (!isDragging && touchedWord === word) {
      onWordPeek(word);
    }

    setTouchedWord(null);
    setTouchStartY(null);
    setTouchStartX(null);
    setIsDragging(false);
  };

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => clearTouchTimeout();
  }, []);

  return (
    <div className={styles.textContainer}>
      {text.map((word, index) => (
        <span
          key={index}
          className={`${styles.wordContainer} ${isChineseCharacter(word.characters) ? styles.interactive : ''}`}
          onTouchStart={(e) => handleTouchStart(e, word)}
          onTouchMove={handleTouchMove}
          onTouchEnd={() => handleTouchEnd(word)}
          onMouseDown={() => {
            if (isChineseCharacter(word.characters) && !isDragging) {
              clearTouchTimeout();
              touchTimeout.current = window.setTimeout(() => {
                setTouchedWord(word);
              }, 200);
            }
          }}
          onMouseUp={() => {
            clearTouchTimeout();
            if (isChineseCharacter(word.characters) && !isDragging) {
              setTouchedWord(null);
              onWordPeek(word);
            }
          }}
          onMouseLeave={() => {
            clearTouchTimeout();
            if (isChineseCharacter(word.characters)) {
              setTouchedWord(null);
            }
          }}
        >
          {isInWordBank(word) && <span className={styles.wordBankDot} />}
          <span className={styles.word}>{word.characters}</span>
          {touchedWord === word && isChineseCharacter(word.characters) && (
            <div className={`${styles.pinyinPopup} ${styles.visible}`}>
              <div className={styles.character}>{word.characters}</div>
              <div className={styles.pinyin}>{word.pinyin.join(' ')}</div>
            </div>
          )}
        </span>
      ))}
    </div>
  );
}