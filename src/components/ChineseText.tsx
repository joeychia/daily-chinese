import { useState } from 'react';
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

  const isChineseCharacter = (str: string) => {
    return /[\u4E00-\u9FFF]/.test(str);
  };

  return (
    <div className={styles.textContainer}>
      {text.map((word, index) => (
        <span
          key={index}
          className={`${styles.wordContainer} ${isChineseCharacter(word.characters) ? styles.interactive : ''}`}
          onClick={() => isChineseCharacter(word.characters) && onWordPeek(word)}
          onMouseEnter={() => isChineseCharacter(word.characters) && setHoveredWord(word)}
          onMouseLeave={() => isChineseCharacter(word.characters) && setHoveredWord(null)}
        >
          {isInWordBank(word) && <span className={styles.wordBankDot} />}
          <span className={styles.word}>{word.characters}</span>
          {hoveredWord === word && isChineseCharacter(word.characters) && (
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