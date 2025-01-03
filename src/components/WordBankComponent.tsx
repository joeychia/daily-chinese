import React from 'react';
import { ChineseWord } from '../data/sampleText';
import { PrintableCards } from './PrintableCards';
import { ConfirmDialog } from './ConfirmDialog';
import styles from './WordBankComponent.module.css';

interface WordBankComponentProps {
  words: ChineseWord[];
  title: string;
  onDeleteWord: (word: ChineseWord) => void;
  onWordToDelete: (word: ChineseWord | null) => void;
  showSavedIndicator?: boolean;
}

export const WordBankComponent: React.FC<WordBankComponentProps> = ({
  words,
  title,
  onDeleteWord,
  onWordToDelete,
  showSavedIndicator = false,
}) => {
  const [showPrintPreview, setShowPrintPreview] = React.useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = React.useState(false);
  const [wordToDelete, setWordToDelete] = React.useState<ChineseWord | null>(null);
  const longPressTimeout = React.useRef<NodeJS.Timeout>();

  const handlePrint = () => {
    setShowPrintPreview(true);
    setTimeout(() => {
      window.print();
      setShowPrintPreview(false);
    }, 100);
  };

  const handleWordTouchStart = (word: ChineseWord) => {
    longPressTimeout.current = setTimeout(() => {
      setWordToDelete(word);
      onWordToDelete(word);
      setShowConfirmDialog(true);
    }, 500);
  };

  const handleWordTouchEnd = () => {
    if (longPressTimeout.current) {
      clearTimeout(longPressTimeout.current);
    }
  };

  const handleDeleteConfirm = () => {
    if (wordToDelete) {
      onDeleteWord(wordToDelete);
      setShowConfirmDialog(false);
      setWordToDelete(null);
      onWordToDelete(null);
    }
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
            onTouchStart={() => handleWordTouchStart(word)}
            onTouchEnd={handleWordTouchEnd}
            onMouseDown={() => handleWordTouchStart(word)}
            onMouseUp={handleWordTouchEnd}
            onMouseLeave={handleWordTouchEnd}
          >
            <div className={styles.character}>{word.characters}</div>
            <div className={styles.pinyin}>{word.pinyin.join(' ')}</div>
          </div>
        ))}
      </div>
      {words.length > 0 && (
        <button className={styles.printButton} onClick={handlePrint}>
          打印生词卡
        </button>
      )}
      {showPrintPreview && <PrintableCards words={words} />}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        message={`确定要删除"${wordToDelete?.characters}"吗？`}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowConfirmDialog(false);
          setWordToDelete(null);
        }}
      />
    </div>
  );
}; 