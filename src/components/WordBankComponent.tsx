import React, { useState, useEffect } from 'react';
import { ChineseWord } from '../data/sampleText';
import { TestWordModal } from './TestWordModal';
import { PrintableCards } from './PrintableCards';
import { getCharacterMastery, updateCharacterMastery } from '../services/userDataService';
import { rewardsService } from '../services/rewardsService';
import { useAuth } from '../contexts/AuthContext';
import { ref, get } from 'firebase/database';
import { db } from '../config/firebase';
import styles from './WordBankComponent.module.css';

export interface WordBankComponentProps {
  words: ChineseWord[];
  title: string;
  showSavedIndicator?: boolean;
  onWordDelete?: (word: ChineseWord) => void;
  onPointsUpdate?: () => void;
}

export const WordBankComponent: React.FC<WordBankComponentProps> = ({
  words,
  title,
  showSavedIndicator = false,
  onWordDelete,
  onPointsUpdate
}) => {
  const { user } = useAuth();
  const [selectedWord, setSelectedWord] = useState<ChineseWord | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [masteryData, setMasteryData] = useState<Record<string, number>>({});
  const [testedToday, setTestedToday] = useState<Record<string, boolean>>({});

  // Load mastery data and test dates
  useEffect(() => {
    const loadData = async () => {
      try {
        const [mastery, testDates] = await Promise.all([
          getCharacterMastery(),
          user ? get(ref(db, `users/${user.id}/wordTests`)) : null
        ]);
        
        setMasteryData(mastery || {});
        
        if (testDates && testDates.exists()) {
          const today = new Date().toISOString().split('T')[0];
          const tested: Record<string, boolean> = {};
          const dates = testDates.val();
          
          Object.entries(dates).forEach(([word, date]) => {
            tested[word] = date === today;
          });
          
          setTestedToday(tested);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [user]);

  const handleWordClick = (word: ChineseWord) => {
    setSelectedWord(word);
    setShowTestModal(true);
  };

  const handleTestCorrect = async () => {
    if (!selectedWord || !user) return;

    const currentMastery = masteryData[selectedWord.characters] ?? -1;
    const newMastery = currentMastery + 1;

    try {
      // Update mastery and record test completion for points
      await Promise.all([
        updateCharacterMastery(selectedWord.characters, newMastery),
        rewardsService.recordWordBankTest(user.id, selectedWord.characters)
      ]);

      // Update local state
      setMasteryData(prev => ({
        ...prev,
        [selectedWord.characters]: newMastery
      }));
      
      setTestedToday(prev => ({
        ...prev,
        [selectedWord.characters]: true
      }));

      // Call onPointsUpdate after points are awarded
      await rewardsService.addPoints(user.id, 1, 'wordBank');
      onPointsUpdate?.();

      // Remove word if mastery level reaches 3
      if (newMastery >= 3) {
        onWordDelete?.(selectedWord);
      }
    } catch (error) {
      console.error('Error updating test results:', error);
    }

    // Close modal after successful test
    setSelectedWord(null);
    setShowTestModal(false);
  };

  const handleCloseModal = () => {
    setSelectedWord(null);
    setShowTestModal(false);
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
    setTimeout(() => {
      window.print();
      setShowPrintPreview(false);
    }, 100);
  };

  const getMasteryColor = (mastery: number) => {
    switch (mastery) {
      case 0: return '#F56C6C'; // red
      case 1: return '#D68B1C'; // orange
      case 2: return '#E6B800'; // yellow
      case 3: return '#67C23A'; // green
      default: return '#67C23A'; // green
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        {showSavedIndicator && <span className="px-2 py-1 text-sm text-green-600 bg-green-100 rounded-md">已保存</span>}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
        {words.map((word) => {
          const mastery = masteryData[word.characters] ?? 0;
          const tested = testedToday[word.characters];
          return (
            <div 
              key={word.characters} 
              className={`
                rounded-lg border border-gray-200 
                transition-all duration-200 
                hover:shadow-md 
                relative
                ${tested 
                  ? 'before:content-["✓"] before:absolute before:top-1 before:right-1 before:text-green-600 before:text-sm bg-gray-10' 
                  : `bg-white`
                }`}
            >
              <div 
                className="p-2 cursor-pointer flex items-center justify-center" 
                onClick={() => handleWordClick(word)}
              >
                <span 
                  className="text-xl font-medium"
                  style={{ color: getMasteryColor(mastery) }}
                >
                  {word.characters}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      {words.length > 0 && (
        <button 
          className="mt-6 px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors duration-200 shadow-md hover:shadow-lg"
          onClick={handlePrint}
        >
          打印生词卡
        </button>
      )}
      <TestWordModal
        word={selectedWord}
        isOpen={showTestModal}
        onClose={handleCloseModal}
        onCorrect={handleTestCorrect}
        mastery={selectedWord ? (masteryData[selectedWord.characters] ?? 0) : 0}
      />
      {showPrintPreview && <PrintableCards words={words} />}
    </div>
  );
};