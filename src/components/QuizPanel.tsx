import { useState } from 'react';
import { Quiz } from '../types/reading';
import styles from './QuizPanel.module.css';
import { processChineseText } from '../utils/textProcessor';
import { articleService } from '../services/articleService';
import { analyticsService } from '../services/analyticsService';

interface QuizPanelProps {
  quiz: Quiz;
  onClose: () => void;
  userId?: string;
  articleId?: string;
}

export function QuizPanel({ quiz, onClose, userId, articleId }: QuizPanelProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>(Array(quiz.questions.length).fill(''));
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());

  const handleSubmit = async () => {
    const finalScore = selectedAnswers.filter(
      (answer, index) => answer === quiz.questions[index].correctAnswer
    ).length;
    setScore(finalScore);
    setShowResult(true);

    // Track quiz completion
    analyticsService.trackQuizCompletion(finalScore, quiz.questions.length);

    // Save quiz results if user is logged in
    if (userId && articleId) {
      const duration = Math.round((Date.now() - startTime) / 1000); // Convert to seconds
      try {
        await articleService.saveQuizCompletion(userId, articleId, finalScore, duration);
      } catch (error) {
        console.error('Error saving quiz completion:', error);
      }
    }
  };

  return (
    <div className={styles.quizPanel}>
      <div className={styles.progress}>
        问题 {currentQuestionIndex + 1} / {quiz.questions.length}
      </div>
      <div className={styles.question}>
        <ChineseText text={quiz.questions[currentQuestionIndex].question} onWordPeek={() => {}} />
      </div>
      <div className={styles.options}>
        {quiz.questions[currentQuestionIndex].options.map((option, index) => (
          <button
            key={index}
            className={`${styles.option} ${
              selectedAnswers[currentQuestionIndex] === option ? styles.selected : ''
            } ${
              showResult
                ? selectedAnswers[currentQuestionIndex] === option
                  ? styles.correct
                  : selectedAnswers[currentQuestionIndex] === quiz.questions[currentQuestionIndex].correctAnswer
                  ? styles.incorrect
                  : ''
                : ''
            }`}
            onClick={() => setSelectedAnswers(prev => {
              const newAnswers = [...prev];
              newAnswers[currentQuestionIndex] = option;
              return newAnswers;
            })}
          >
            <ChineseText text={option} onWordPeek={() => {}} />
          </button>
        ))}
      </div>
      <div className={styles.actions}>
        {!showResult ? (
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={selectedAnswers[currentQuestionIndex] === ''}
          >
            提交答案
          </button>
        ) : (
          <button className={styles.nextButton} onClick={() => setCurrentQuestionIndex(prev => prev + 1)}>
            {currentQuestionIndex < quiz.questions.length - 1 ? '下一题' : '查看结果'}
          </button>
        )}
      </div>
    </div>
  );
} 