import { useState } from 'react';
import { Quiz } from '../types/reading';
import styles from './QuizPanel.module.css';

interface QuizPanelProps {
  quizzes: Quiz[];
}

interface QuizResult {
  questionIndex: number;
  selectedAnswer: number;
  isCorrect: boolean;
}

export const QuizPanel: React.FC<QuizPanelProps> = ({ quizzes }) => {
  const [currentQuiz, setCurrentQuiz] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showAnswer) return;
    setSelectedAnswer(answerIndex);
  };

  const handleCheckAnswer = () => {
    if (selectedAnswer === null) return;

    const isCorrect = selectedAnswer === quizzes[currentQuiz].correctAnswer;
    setShowAnswer(true);
    setResults(prev => [...prev, {
      questionIndex: currentQuiz,
      selectedAnswer,
      isCorrect
    }]);
  };

  const handleNextQuestion = () => {
    if (currentQuiz < quizzes.length - 1) {
      setCurrentQuiz(prev => prev + 1);
      setSelectedAnswer(null);
      setShowAnswer(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleRestartQuiz = () => {
    setCurrentQuiz(0);
    setSelectedAnswer(null);
    setShowAnswer(false);
    setResults([]);
    setQuizCompleted(false);
  };

  const correctAnswers = results.filter(r => r.isCorrect).length;

  if (quizCompleted) {
    return (
      <div className={styles.quizPanel}>
        <h3>测验完成！</h3>
        <div className={styles.results}>
          <div className={styles.score}>
            得分：{correctAnswers} / {quizzes.length}
          </div>
          <div className={styles.percentage}>
            正确率：{Math.round((correctAnswers / quizzes.length) * 100)}%
          </div>
        </div>
        <button 
          className={styles.button} 
          onClick={handleRestartQuiz}
        >
          重新测验
        </button>
      </div>
    );
  }

  const quiz = quizzes[currentQuiz];

  return (
    <div className={styles.quizPanel}>
      <div className={styles.progress}>
        问题 {currentQuiz + 1} / {quizzes.length}
      </div>
      <div className={styles.question}>
        {quiz.question}
      </div>
      <div className={styles.options}>
        {quiz.options.map((option, index) => (
          <button
            key={index}
            className={`${styles.option} ${
              selectedAnswer === index ? styles.selected : ''
            } ${
              showAnswer
                ? index === quiz.correctAnswer
                  ? styles.correct
                  : selectedAnswer === index
                  ? styles.incorrect
                  : ''
                : ''
            }`}
            onClick={() => handleAnswerSelect(index)}
            disabled={showAnswer}
          >
            {option}
          </button>
        ))}
      </div>
      {!showAnswer ? (
        <button
          className={styles.button}
          onClick={handleCheckAnswer}
          disabled={selectedAnswer === null}
        >
          检查答案
        </button>
      ) : (
        <button
          className={styles.button}
          onClick={handleNextQuestion}
        >
          {currentQuiz < quizzes.length - 1 ? '下一题' : '完成测验'}
        </button>
      )}
    </div>
  );
}; 