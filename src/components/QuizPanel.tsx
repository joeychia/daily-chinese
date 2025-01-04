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

  const currentQuiz = quizzes[currentQuizIndex];
  const processedQuestion = processChineseText(currentQuiz.question);
  const processedOptions = currentQuiz.options.map(option => processChineseText(option));

  const handleSubmit = async () => {
    if (selectedAnswers[currentQuizIndex] === -1) return;

    const isCorrect = selectedAnswers[currentQuizIndex] === currentQuiz.correctOption;
    if (isCorrect) {
      setScore(prev => prev + 1);
    }

    if (currentQuizIndex < quizzes.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
    } else {
      setShowResult(true);
      analyticsService.trackQuizCompletion(score + (isCorrect ? 1 : 0), quizzes.length);
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
        {processedOptions.map((option, index) => (
          <button
            key={index}
            className={`${styles.option} ${
              selectedAnswers[currentQuizIndex] === index ? styles.selected : ''
            }`}
            onClick={() => {
              const newAnswers = [...selectedAnswers];
              newAnswers[currentQuizIndex] = index;
              setSelectedAnswers(newAnswers);
            }}
          >
            <ChineseText text={option} onWordPeek={() => {}} />
          </button>
        ))}
      </div>
      <div className={styles.actions}>
        <button
          className={styles.button}
          onClick={handleSubmit}
          disabled={selectedAnswers[currentQuizIndex] === -1}
        >
          {currentQuizIndex < quizzes.length - 1 ? '下一题' : '完成测验'}
        </button>
      </div>
    </div>
  );
} 