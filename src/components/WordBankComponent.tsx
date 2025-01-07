import React from 'react';
import { ChineseWord } from '../data/sampleText';
import { PrintableCards } from './PrintableCards';
import styles from './WordBankComponent.module.css';

interface WordBankComponentProps {
  words: ChineseWord[];
  title: string;
  onWordClick: (word: ChineseWord) => void;
  showSavedIndicator?: boolean;
}

export const WordBankComponent: React.FC<WordBankComponentProps> = ({
  words,
  title,
  onWordClick,
  showSavedIndicator = false,
}) => {
  const [showPrintPreview, setShowPrintPreview] = React.useState(false);

  const handlePrint = () => {
    setShowPrintPreview(true);
    setTimeout(() => {
      window.print();
      setShowPrintPreview(false);
    }, 100);
  };

  return (
    <div className={styles.wordBank}>
      <h2>
        {title}
        {showSavedIndicator && (
          <span className={styles.saveStatus}>已保存</span>
        )}
      </h2>
      <div className={styles.wordList}>
        {words.map((word, index) => (
          <div
            key={index}
            className={styles.wordCard}
            onClick={() => onWordClick(word)}
          >
            <div className={styles.character}>{word.characters}</div>
          </div>
        ))}
      </div>
      {words.length > 0 && (
        <button className={styles.printButton} onClick={handlePrint}>
          打印生词卡
        </button>
      )}
      {showPrintPreview && <PrintableCards words={words} />}
    </div>
  );
}; 