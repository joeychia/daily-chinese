import React, { useState } from 'react';
import { ChineseWord } from '../data/sampleText';
import styles from './StudyWordModal.module.css';

interface StudyWordModalProps {
  word: ChineseWord | null;
  isOpen: boolean;
  onClose: () => void;
  onCorrect: () => void;
  mastery: number;
}

export const StudyWordModal: React.FC<StudyWordModalProps> = ({
  word,
  isOpen,
  onClose,
  onCorrect,
  mastery
}) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen || !word) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedInput = input.toLowerCase().trim();
    const correctPinyin = word.pinyin.join(' ').toLowerCase();

    if (normalizedInput === correctPinyin) {
      setError(false);
      onCorrect();
      onClose();
    } else {
      setError(true);
    }
  };

  const getMasteryText = (level: number) => {
    switch (level) {
      case -1: return '未读';
      case 0: return '不熟';
      case 1: return '学过一次';
      case 2: return '学过两次';
      case 3: return '已掌握';
      default: return '未读';
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>练习</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.content}>
          <div className={styles.character}>{word.characters}</div>
          <div className={styles.mastery}>掌握程度：{getMasteryText(mastery)}</div>
          <form onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <label>请输入拼音：</label>
              <input
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError(false);
                }}
                placeholder="输入拼音，声调用数字表示"
                autoFocus
              />
            </div>
            {error && (
              <div className={styles.error}>
                拼音不正确，正确答案是：{word.pinyin.join(' ')}
              </div>
            )}
            <div className={styles.buttons}>
              <button type="button" onClick={onClose}>取消</button>
              <button type="submit">确认</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}; 