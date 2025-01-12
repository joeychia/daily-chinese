/**
 * QuizPanel Component Requirements
 * 
 * Purpose:
 * Provides an interactive quiz interface for testing reading comprehension
 * with character mastery tracking and analytics integration.
 * 
 * Core Features:
 * 1. Quiz Navigation:
 *    - Step-by-step question progression
 *    - Progress indicator (current/total questions)
 *    - Answer submission and validation
 *    - Final results display
 * 
 * 2. Answer Interaction:
 *    - Single option selection per question
 *    - Immediate feedback after submission
 *    - Visual indication of correct/incorrect answers
 *    - Disabled options after submission
 * 
 * 3. Character Learning:
 *    - Interactive Chinese text display
 *    - Character click tracking for learning analytics
 *    - Automatic mastery level updates:
 *      * Clicked characters: Level 0 (needs review)
 * 
 * 4. Results Handling:
 *    - Score calculation (percentage)
 *    - Quiz completion tracking
 *    - Analytics integration
 * 
 * 5. Post-Quiz Navigation:
 *    - "Read one more" button after completion
 *    - Automatic navigation to next unread article
 *    - Progress tracking for completed articles
 * 
 * Technical Requirements:
 * - Real-time state management
 * - Firebase integration for mastery updates
 * - Analytics service integration
 * - Accessibility support
 * - Character processing utilities
 */

import { useState, useEffect } from 'react';
import { Quiz } from '../types/reading';
import styles from './QuizPanel.module.css';
import { processChineseText } from '../utils/textProcessor';
import { analyticsService } from '../services/analyticsService';
import { ChineseText } from './ChineseText';
import { userDataService } from '../services/userDataService';
import { rewardsService } from '../services/rewardsService';
import { useAuth } from '../contexts/AuthContext';

interface QuizPanelProps {
  isOpen: boolean;
  onClose: () => void;
  quizzes: Quiz[];
  onComplete: (score: number) => void;
  articleId: string;
  onPointsUpdate: () => void;
}

export function QuizPanel({ isOpen, onClose, quizzes, onComplete, articleId, onPointsUpdate }: QuizPanelProps) {
  const { user } = useAuth();
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(Array(quizzes.length).fill(-1));
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [clickedCharacters, setClickedCharacters] = useState<string[]>([]);
  const [hasReadArticle, setHasReadArticle] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const articleText = quizzes.map(q => q.question).join('');

  useEffect(() => {
    const checkArticleRead = async () => {
      if (!user) return;
      const hasRead = await userDataService.hasReadArticle(user.id, articleId);
      setHasReadArticle(hasRead);
    };
    checkArticleRead();
  }, [user, articleId]);

  const currentQuiz = quizzes[currentQuizIndex];
  const processedQuestion = processChineseText(currentQuiz.question);
  const processedOptions = currentQuiz.options.map(option => processChineseText(option));

  const handleCharacterClick = (char: string) => {
    setClickedCharacters(prev => [...prev, char]);
  };

  const handleSubmit = async () => {
    if (selectedAnswers[currentQuizIndex] === -1) return;

    if (!isChecking) {
      setIsChecking(true);
      const isCorrect = selectedAnswers[currentQuizIndex] === currentQuiz.correctOption;
      if (isCorrect) {
        setScore(prev => prev + 1);
        if (!hasReadArticle && user) {
          try {
            await rewardsService.addPoints(user.id, 10, 'quiz');
            onPointsUpdate();
          } catch (error) {
            console.error('Error adding points:', error);
          }
        }
      }
      return;
    }

    // Move to next question or show results
    setIsChecking(false);
    if (currentQuizIndex < quizzes.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      setShowResult(true);
      analyticsService.trackQuizCompletion(score + 1, quizzes.length);
      onComplete(score);
      onClose();
    }

    // Update character mastery based on clicked characters
    const uniqueClickedChars = Array.from(new Set(clickedCharacters));
    if (uniqueClickedChars.length > 0) {
      await userDataService.updateCharacterMastery(uniqueClickedChars, 0);
    }

    // Get all unique characters from the article text
    const allChars = Array.from(new Set(articleText.split('')));
    const masteredChars = allChars.filter(char => !clickedCharacters.includes(char));
    if (masteredChars.length > 0) {
      await userDataService.updateCharacterMastery(masteredChars, 3, true);
    }
  };

  if (showResult) {
    return (
      <div className={styles.quizPanel}>
        <h2>测验结果</h2>
        <p>得分：{Math.round((score / quizzes.length) * 100)}%</p>
        <p>正确：{score} / {quizzes.length}</p>
      </div>
    );
  }

  return (
    <div className={styles.quizPanel}>
      <div className={styles.progress}>
        问题 {currentQuizIndex + 1} / {quizzes.length}
      </div>
      <div className={styles.question}>
        <ChineseText 
          text={processChineseText(currentQuiz.question)}
          onWordPeek={(word) => handleCharacterClick(word.characters)}
        />
      </div>
      <div className={styles.options}>
        {currentQuiz.options.map((option, index) => {
          let optionClass = styles.option;
          if (selectedAnswers[currentQuizIndex] === index) {
            optionClass += ' ' + styles.selected;
          }
          if (isChecking) {
            if (index === currentQuiz.correctOption) {
              optionClass += ' ' + styles.correct;
            } else if (selectedAnswers[currentQuizIndex] === index) {
              optionClass += ' ' + styles.incorrect;
            }
          }
          
          return (
            <button
              key={index}
              className={optionClass}
              onClick={() => {
                if (!isChecking) {
                  const newAnswers = [...selectedAnswers];
                  newAnswers[currentQuizIndex] = index;
                  setSelectedAnswers(newAnswers);
                }
              }}
              disabled={isChecking}
            >
              <ChineseText 
                text={processChineseText(option)}
                onWordPeek={(word) => handleCharacterClick(word.characters)}
              />
            </button>
          );
        })}
      </div>
      <div className={styles.actions}>
        <button
          className={styles.button}
          onClick={handleSubmit}
          disabled={selectedAnswers[currentQuizIndex] === -1}
        >
          {isChecking 
            ? (currentQuizIndex < quizzes.length - 1 ? '下一题' : '完成测验')
            : '检查答案'
          }
        </button>
      </div>
    </div>
  );
} 