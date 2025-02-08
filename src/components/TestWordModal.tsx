import React, { useState, useEffect } from 'react';
import { ChineseWord } from '../data/sampleText';
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
      case 1: return '测过一次';
      case 2: return '测过两次';
      case 3: return '已掌握';
      default: return '未读';
    }
  };

  const getRemainingTests = (level: number) => {
    return Math.max(0, 3 - level);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 overflow-hidden transform transition-all">
        <div className="flex items-center justify-between px-3 py-1.5 bg-gradient-to-r from-blue-50 to-purple-50">
          <h2 className="text-base font-semibold text-gray-800">测试</h2>
          <button 
            className="text-gray-500 hover:text-gray-700 text-base font-light transition-colors px-2"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <div className="p-4 space-y-2">
          <div className="text-4xl text-center font-bold text-gray-800">{word.characters}</div>
          <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
            掌握程度：
            <span className="font-medium">{getMasteryText(currentMastery)}</span>
            {isTestedToday && (
              <span className="ml-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                今天已测试
              </span>
            )}
          </div>
          {isTestedToday ? (
            <div className="space-y-4">
              {currentMastery < 3 && (
                <div className="text-xs text-center text-gray-600">
                  还需改天再测试{getRemainingTests(currentMastery)}次
                </div>
              )}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg"
                >
                  关闭
                </button>
              </div>
            </div>
          ) : showSuccess ? (
            <div className="space-y-4">
              <div className="text-sm text-center text-green-600 font-medium">回答正确！</div>
              <div className="text-xs text-center text-gray-600">
                {currentMastery < 3 ? 
                  `还需测试${getRemainingTests(currentMastery)}次` :
                  '已掌握，将从生词本中移除'
                }
              </div>
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg"
                >
                  关闭
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value);
                    setError(false);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="输入拼音（不用输入声调）"
                  className="w-full px-3 py-1.5 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  autoFocus
                />
              </div>
              {error && (
                <div className="text-xs text-red-500 text-center">
                  正确答案：{word.pinyin.join(' ')}
                </div>
              )}
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={handleCheck}
                  className="px-4 py-1.5 text-sm bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors shadow-md hover:shadow-lg"
                >
                  确认
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};