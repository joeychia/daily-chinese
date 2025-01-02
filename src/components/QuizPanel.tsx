import { useState, useCallback } from 'react';
import { Quiz } from '../types/reading';
import styles from './QuizPanel.module.css';
import { processChineseText } from '../utils/textProcessor';
import type { ChineseWord } from '../data/sampleText';

interface ActiveWordInfo {
  word: ChineseWord;
  optionIndex: number;
  wordIndex: number;
}

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
  const [activeWord, setActiveWord] = useState<ActiveWordInfo | null>(null);

  const handleAnswerSelect = (answerIndex: number) => {
    if (showAnswer) return;
    setSelectedAnswer(answerIndex);
  };

  const handleMouseDown = useCallback((word: ChineseWord, optionIndex: number = -1, wordIndex: number) => {
    setActiveWord({ word, optionIndex, wordIndex });
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent, word: ChineseWord, optionIndex: number = -1, wordIndex: number) => {
    e.preventDefault(); // Prevent double-firing on mobile
    e.stopPropagation(); // Stop event bubbling
    setActiveWord({ word, optionIndex, wordIndex });
  }, []);

  const handleRelease = useCallback(() => {
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
  const processedOptions = quiz.options.map(option => processChineseText(option));

  return (
    <div className={styles.quizPanel}>
      <div className={styles.progress}>
        问题 {currentQuiz + 1} / {quizzes.length}
      </div>
      <div className={`${styles.question} chinese-text`}>
        {processedQuestion.map((word, index) => {
          const isActive = activeWord?.optionIndex === -1 && activeWord?.wordIndex === index;
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
              onMouseDown={() => handleMouseDown(word, -1, index)}
              onMouseUp={handleRelease}
              onMouseLeave={handleRelease}
              onTouchStart={(e) => handleTouchStart(e, word, -1, index)}
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
        {processedOptions.map((option, optionIndex) => (
          <button
            key={optionIndex}
            className={`${styles.option} ${
              selectedAnswer === optionIndex ? styles.selected : ''
            } ${
              showAnswer
                ? optionIndex === quiz.correctAnswer
                  ? styles.correct
                  : selectedAnswer === optionIndex
                  ? styles.incorrect
                  : ''
                : ''
            }`}
            onClick={() => handleAnswerSelect(optionIndex)}
            disabled={showAnswer}
          >
            {option.map((word, wordIndex) => {
              const isActive = activeWord?.optionIndex === optionIndex && activeWord?.wordIndex === wordIndex;
              return (
                <span
                  key={wordIndex}
                  style={{ 
                    display: 'inline-block',
                    position: 'relative',
                    cursor: 'pointer',
                    padding: '0 2px',
                    userSelect: 'none',
                    WebkitUserSelect: 'none'
                  }}
                  onMouseDown={(e) => {
                    e.stopPropagation(); // Prevent button click when showing pinyin
                    handleMouseDown(word, optionIndex, wordIndex);
                  }}
                  onMouseUp={(e) => {
                    e.stopPropagation();
                    handleRelease();
                  }}
                  onMouseLeave={handleRelease}
                  onTouchStart={(e) => {
                    handleTouchStart(e, word, optionIndex, wordIndex);
                  }}
                  onTouchEnd={(e) => {
                    e.stopPropagation();
                    handleRelease();
                  }}
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