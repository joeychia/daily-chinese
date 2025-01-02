import { useState, useCallback } from 'react';
import { Quiz } from '../types/reading';
import styles from './QuizPanel.module.css';
import { processChineseText } from '../utils/textProcessor';
import type { ChineseWord } from '../data/sampleText';

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
  const [activeWord, setActiveWord] = useState<ChineseWord | null>(null);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showAnswer) return;
    setSelectedAnswer(answerIndex);
  };

  const handleMouseDown = useCallback((word: ChineseWord) => {
    console.log('Mouse down on word:', word);
    setActiveWord(word);
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent, word: ChineseWord) => {
    console.log('Touch start on word:', word);
    e.preventDefault(); // Prevent double-firing on mobile
    e.stopPropagation(); // Stop event bubbling
    setActiveWord(word);
  }, []);

  const handleRelease = useCallback(() => {
    console.log('Release, clearing active word');
    setActiveWord(null);
  }, []);

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
  const processedQuestion = processChineseText(quiz.question);

  console.log('Active word:', activeWord);

  return (
    <div className={styles.quizPanel}>
      <div className={styles.progress}>
        问题 {currentQuiz + 1} / {quizzes.length}
      </div>
      <div className={`${styles.question} chinese-text`}>
        {processedQuestion.map((word, index) => {
          const isActive = activeWord?.characters === word.characters;
          console.log('Rendering word:', word.characters, 'isActive:', isActive);
          return (
            <span
              key={index}
              style={{ 
                display: 'inline-block',
                position: 'relative',
                cursor: 'pointer',
                padding: '0 2px',
                userSelect: 'none',
                WebkitUserSelect: 'none'
              }}
              onMouseDown={() => handleMouseDown(word)}
              onMouseUp={handleRelease}
              onMouseLeave={handleRelease}
              onTouchStart={(e) => handleTouchStart(e, word)}
              onTouchEnd={handleRelease}
            >
              {word.characters}
              {isActive && (
                <div className="pinyin-popup visible">
                  <div className="character">{word.characters}</div>
                  <div className="pinyin">{word.pinyin.join(' ')}</div>
                </div>
              )}
            </span>
          );
        })}
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