import React, { useState, useEffect } from 'react';
import { ChineseWord } from '../data/sampleText';
import styles from './TestWordModal.module.css';
import { pinyin } from 'pinyin-pro';
import { useAuth } from '../contexts/AuthContext';
import { ref, get, set } from 'firebase/database';
import { db } from '../config/firebase';

interface TestWordModalProps {
  word: ChineseWord | null;
  isOpen: boolean;
  onClose: () => void;
  onCorrect: () => void;
  mastery: number;
}

export const TestWordModal: React.FC<TestWordModalProps> = ({
  word,
  isOpen,
  onClose,
  onCorrect,
  mastery
}) => {
  const { user } = useAuth();
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const [isTestedToday, setIsTestedToday] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [currentMastery, setCurrentMastery] = useState(mastery);

  // Reset states when a new word is selected
  useEffect(() => {
    setInput('');
    setError(false);
    setShowSuccess(false);
    setCurrentMastery(mastery);
  }, [word?.characters]);

  useEffect(() => {
    if (word && user) {
      checkIfTestedToday(word.characters);
    }
  }, [word, user]);

  const checkIfTestedToday = async (character: string) => {
    if (!user) return;
    
    try {
      const testRef = ref(db, `users/${user.id}/wordTests/${character}`);
      const snapshot = await get(testRef);
      const today = new Date().toISOString().split('T')[0];
      setIsTestedToday(snapshot.exists() && snapshot.val() === today);
    } catch (error) {
      console.error('Error checking test date:', error);
    }
  };

  const recordTest = async (character: string) => {
    if (!user) return;
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const testRef = ref(db, `users/${user.id}/wordTests/${character}`);
      await set(testRef, today);
    } catch (error) {
      console.error('Error recording test date:', error);
    }
  };

  if (!isOpen || !word) return null;

  const handleCheck = async () => {
    const userInput = input.trim().toLowerCase();
    
    // Get all possible pinyin readings for the character
    const readings = pinyin(word.characters, { toneType: 'none', multiple: true, type: 'array' });
    const possibleReadings = Array.isArray(readings) ? readings : [readings];
    const lowerCaseReadings = possibleReadings.map(reading => 
        reading.toLowerCase().replace('ǚ', 'v').replace('ü', 'v')
    );

    if (lowerCaseReadings.includes(userInput)) {
      setError(false);
      setShowSuccess(true);
      if (!isTestedToday) {
        await recordTest(word.characters);
        onCorrect();
        setCurrentMastery(prev => prev + 1);
      }
    } else {
      setError(true);
      setShowSuccess(false);
    }
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleCheck();
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

  const getRemainingTests = (level: number) => {
    return Math.max(0, 3 - level);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>测试</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        <div className={styles.content}>
          <div className={styles.character}>{word.characters}</div>
          <div className={styles.mastery}>
            掌握程度：{getMasteryText(currentMastery)}
            {isTestedToday && <span className={styles.testedBadge}>（今天已测试）</span>}
          </div>
          {isTestedToday ? (
            <div className={styles.message}>
              <div className={styles.success}>今天已经测试过这个字了！</div>
              {currentMastery < 3 && (
                <div className={styles.hint}>
                  还需要在其他日子测试{getRemainingTests(currentMastery)}次才能从生词本中移除
                </div>
              )}
              <div className={styles.buttons}>
                <button type="button" onClick={onClose}>关闭</button>
              </div>
            </div>
          ) : showSuccess ? (
            <div className={styles.message}>
              <div className={styles.success}>回答正确！</div>
              <div className={styles.hint}>
                {currentMastery < 3 ? 
                  `还需要在其他日子测试${getRemainingTests(currentMastery)}次才能从生词本中移除` :
                  '恭喜！这个字已经掌握了，将从生词本中移除。'
                }
              </div>
              <div className={styles.buttons}>
                <button type="button" onClick={onClose}>关闭</button>
              </div>
            </div>
          ) : (
            <div>
              <div className={styles.inputGroup}>
                <label>请输入拼音：</label>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setError(false);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="输入拼音（不用输入声调）"
                  autoFocus
                />
              </div>
              {error && (
                <div className={styles.error}>
                  拼音不正确，正确答案是：{word.pinyin.join(' ')}
                </div>
              )}
              <div className={styles.buttons}>
                <button type="button" onClick={handleCheck}>确认</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 