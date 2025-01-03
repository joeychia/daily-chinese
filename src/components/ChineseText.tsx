import React, { useState } from 'react';
import { ChineseWord } from '../data/sampleText';
import styles from './ChineseText.module.css';

interface ChineseTextProps {
  text: ChineseWord[];
  onWordPeek: (word: ChineseWord) => void;
  wordBank?: ChineseWord[];
}

export function ChineseText({ text, onWordPeek, wordBank = [] }: ChineseTextProps) {
  const [hoveredWord, setHoveredWord] = useState<ChineseWord | null>(null);

  const isInWordBank = (word: ChineseWord) => {
    return wordBank.some(w => w.characters === word.characters);
  };

  return (
    <div className={styles.textContainer}>
      {text.map((word, index) => (
        <span
          key={index}
          className={styles.wordContainer}
          onClick={() => onWordPeek(word)}
          onMouseEnter={() => setHoveredWord(word)}
          onMouseLeave={() => setHoveredWord(null)}
        >
          {isInWordBank(word) && <span className={styles.wordBankDot} />}
          <span className={styles.word}>{word.characters}</span>
          {hoveredWord === word && (
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