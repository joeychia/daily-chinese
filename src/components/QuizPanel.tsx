import { useState } from 'react';
import { Quiz } from '../types/reading';
import { saveQuizCompletion } from '../services/userDataService';
import { useAuth } from '../contexts/AuthContext';
import styles from './QuizPanel.module.css';
import { ChineseText } from './ChineseText';
import { processChineseText } from '../utils/textProcessor';

interface QuizPanelProps {
  quizzes: Quiz[];
  articleId: string;
  startTime: number;
  onComplete?: () => void;
}

export const QuizPanel: React.FC<QuizPanelProps> = ({ quizzes, articleId, startTime, onComplete }) => {
  const { user } = useAuth();
  const [currentQuizIndex, setCurrentQuizIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const currentQuiz = quizzes[currentQuizIndex];
  const processedQuestion = processChineseText(currentQuiz.question);
  const processedOptions = currentQuiz.options.map(option => processChineseText(option));

  const handleOptionSelect = (optionIndex: number) => {
    if (!isSubmitted) {
      setSelectedOption(optionIndex);
    }
  };

  const handleNext = async () => {
    if (selectedOption === null) return;

    if (selectedOption === currentQuiz.correctOption) {
      setScore(prev => prev + 1);
    }

    if (currentQuizIndex < quizzes.length - 1) {
      setCurrentQuizIndex(prev => prev + 1);
      setSelectedOption(null);
    } else {
      setShowResult(true);
      const finalScore = ((score + (selectedOption === currentQuiz.correctOption ? 1 : 0)) / quizzes.length) * 100;
      const duration = Math.floor((Date.now() - startTime) / 1000); // Convert to seconds
      
      if (user) {
        await saveQuizCompletion(user.id, articleId, finalScore, duration);
      }
    }
    setIsSubmitted(false);
  };

  const handleSubmit = async () => {
    if (selectedOption !== null) {
      setIsSubmitted(true);
    }
    
    // Call onComplete when quiz is finished
    if (onComplete) {
      onComplete();
    }
  };

  if (showResult) {
    const finalScore = ((score + (selectedOption === currentQuiz.correctOption ? 1 : 0)) / quizzes.length) * 100;
    return (
      <div className={styles.quizPanel}>
        <h2>测验结果</h2>
        <p>得分：{finalScore.toFixed(0)}%</p>
        <p>正确：{score + (selectedOption === currentQuiz.correctOption ? 1 : 0)} / {quizzes.length}</p>
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
              selectedOption === index ? styles.selected : ''
            } ${
              isSubmitted
                ? index === currentQuiz.correctOption
                  ? styles.correct
                  : selectedOption === index
                  ? styles.incorrect
                  : ''
                : ''
            }`}
            onClick={() => handleOptionSelect(index)}
          >
            <ChineseText text={option} onWordPeek={() => {}} />
          </button>
        ))}
      </div>
      <div className={styles.actions}>
        {!isSubmitted ? (
          <button
            className={styles.submitButton}
            onClick={handleSubmit}
            disabled={selectedOption === null}
          >
            提交答案
          </button>
        ) : (
          <button className={styles.nextButton} onClick={handleNext}>
            {currentQuizIndex < quizzes.length - 1 ? '下一题' : '查看结果'}
          </button>
        )}
      </div>
    </div>
  );
}; 