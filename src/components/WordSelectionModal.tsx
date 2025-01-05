import React from 'react';
import styles from './WordSelectionModal.module.css';
import { ChineseWord } from '../types/reading';

interface WordSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  words: ChineseWord[];
  selectedWords: ChineseWord[];
  onWordSelect: (word: ChineseWord) => void;
}

export default function WordSelectionModal({
  isOpen,
  onClose,
  words,
  selectedWords,
  onWordSelect,
}: WordSelectionModalProps) {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h3>选择词语 ({selectedWords.length}/10)</h3>
          <button onClick={onClose} className={styles.closeButton}>×</button>
        </div>
        <div className={styles.modalContent}>
          <div className={styles.wordGrid}>
            {words.map((word) => (
              <button
                key={word.characters}
                className={`${styles.wordItem} ${selectedWords.includes(word) ? styles.selected : ''}`}
                onClick={() => onWordSelect(word)}
                disabled={selectedWords.length >= 10 && !selectedWords.includes(word)}
                title={word.pinyin.join(' ')}
              >
                {word.characters}
              </button>
            ))}
          </div>
        </div>
        <div className={styles.modalFooter}>
          <button onClick={onClose} className={styles.confirmButton}>
            确认
          </button>
        </div>
      </div>
    </div>
  );
} 