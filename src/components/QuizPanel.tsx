import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { userDataService } from '../services/userDataService';
import styles from './QuizPanel.module.css';

interface Quiz {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface QuizPanelProps {
  quizzes: Quiz[];
  articleId: string;
  startTime: number;
}

export const QuizPanel = ({ quizzes, articleId, startTime }: QuizPanelProps) => {
  const { user } = useAuth();
  const [currentQuiz, setCurrentQuiz] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [correctAnswers, setCorrectAnswers] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [readingDuration, setReadingDuration] = useState(0);

  useEffect(() => {
    if (showResults && user) {
      const duration = Math.floor((Date.now() - startTime) / 1000);
      setReadingDuration(duration);
      const score = Math.round((correctAnswers / quizzes.length) * 100);
      userDataService.saveQuizCompletion(user.id, articleId, score, duration);
    }
  }, [showResults, user, correctAnswers, quizzes.length, articleId, startTime]);

  const handleAnswerSelect = (index: number) => {
    if (!isAnswerChecked) {
      setSelectedAnswer(index);
    }
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer === null) return;

    setIsAnswerChecked(true);
    if (selectedAnswer === quizzes[currentQuiz].correctAnswer) {
      setCorrectAnswers(prev => prev + 1);
    }
  };

  const handleNextQuiz = () => {
    if (currentQuiz < quizzes.length - 1) {
      setCurrentQuiz(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerChecked(false);
    } else {
      setShowResults(true);
    }
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  if (showResults) {
    const score = Math.round((correctAnswers / quizzes.length) * 100);
    return (
      <div className={styles.quizPanel}>
        <h2>测验结果</h2>
        <div className={styles.results}>
          <p>得分：{score}分</p>
          <p>正确答案：{correctAnswers} / {quizzes.length}</p>
          <p>阅读用时：{formatDuration(readingDuration)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.quizPanel}>
      <div className={styles.progress}>
        问题 {currentQuiz + 1} / {quizzes.length}
      </div>
      <div className={styles.question}>
        {quizzes[currentQuiz].question}
      </div>
      <div className={styles.options}>
        {quizzes[currentQuiz].options.map((option, index) => (
          <button
            key={index}
            className={`${styles.option} ${
              selectedAnswer === index ? styles.selected : ''
            } ${
              isAnswerChecked
                ? index === quizzes[currentQuiz].correctAnswer
                  ? styles.correct
                  : selectedAnswer === index
                  ? styles.incorrect
                  : ''
                : ''
            }`}
            onClick={() => handleAnswerSelect(index)}
            disabled={isAnswerChecked}
          >
            {option}
          </button>
        ))}
      </div>
      {!isAnswerChecked ? (
        <button
          className={styles.checkButton}
          onClick={handleCheckAnswer}
          disabled={selectedAnswer === null}
        >
          检查答案
        </button>
      ) : (
        <button
          className={styles.nextButton}
          onClick={handleNextQuiz}
        >
          {currentQuiz < quizzes.length - 1 ? '下一题' : '查看结果'}
        </button>
      )}
    </div>
  );
}; 