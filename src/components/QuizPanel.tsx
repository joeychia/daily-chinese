import { useState } from 'react';
import { Quiz } from '../types/reading';
import styles from './QuizPanel.module.css';
import { processChineseText } from '../utils/textProcessor';
import { analyticsService } from '../services/analyticsService';
import { ChineseText } from './ChineseText';

interface QuizPanelProps {
  quizzes: Quiz[];
  onComplete: () => void;
}

export function QuizPanel({ quizzes, onComplete }: QuizPanelProps) {
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>(Array(quizzes.length).fill(-1));
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isChecking, setIsChecking] = useState(false);

  const currentQuiz = quizzes[currentQuizIndex];
  const processedQuestion = processChineseText(currentQuiz.question);
  const processedOptions = currentQuiz.options.map(option => processChineseText(option));

  const handleSubmit = async () => {
    if (selectedAnswers[currentQuizIndex] === -1) return;

    if (!isChecking) {
      setIsChecking(true);
      const isCorrect = selectedAnswers[currentQuizIndex] === currentQuiz.correctOption;
      if (isCorrect) {
        setScore(prev => prev + 1);
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
      onComplete();
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
        <ChineseText text={processedQuestion} onWordPeek={() => {}} />
      </div>
      <div className={styles.options}>
        {processedOptions.map((option, index) => {
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
              <ChineseText text={option} onWordPeek={() => {}} />
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