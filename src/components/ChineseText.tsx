import { useState } from 'react';
import { ChineseWord } from '../data/sampleText';
import styles from './ChineseText.module.css';

interface ChineseTextProps {
  text: ChineseWord[];
  onWordPeek: (word: ChineseWord) => void;
  wordBank?: ChineseWord[];
}

export function ChineseText({ text, onWordPeek, wordBank = [] }: ChineseTextProps) {
  const [touchedWord, setTouchedWord] = useState<ChineseWord | null>(null);

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
          onTouchStart={(e) => {
            e.preventDefault();
            if (isChineseCharacter(word.characters)) {
              setTouchedWord(word);
            }
          }}
          onTouchEnd={() => {
            if (isChineseCharacter(word.characters)) {
              setTouchedWord(null);
              onWordPeek(word);
            }
          }}
          onMouseDown={() => isChineseCharacter(word.characters) && setTouchedWord(word)}
          onMouseUp={() => {
            if (isChineseCharacter(word.characters)) {
              setTouchedWord(null);
              onWordPeek(word);
            }
          }}
          onMouseLeave={() => isChineseCharacter(word.characters) && setTouchedWord(null)}
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