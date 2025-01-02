import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import { ChineseText } from './components/ChineseText'
import { PrintableCards } from './components/PrintableCards'
import { ThemePanel } from './components/ThemePanel'
import { QuizPanel } from './components/QuizPanel'
import Articles from './components/Articles'
import { ChineseWord } from './data/sampleText'
import { themes } from './config/themes'
import { processChineseText } from './utils/textProcessor'
import { Reading } from './types/reading'
import sampleReading from './data/readings/sample.json'
import { initializeDatabase } from './scripts/initializeDb'
import './App.css'

function MainContent() {
  const [processedText, setProcessedText] = useState<ChineseWord[]>([]);
  const [wordBank, setWordBank] = useState<ChineseWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string>('candy');
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);
  const [reading, _setReading] = useState<Reading>(sampleReading);
  const [showQuiz, setShowQuiz] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    
    try {
      const processed = processChineseText(reading.content);
      setProcessedText(processed);
      setIsLoading(false);
    } catch (error) {
      console.error('Error processing text:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      setIsLoading(false);
    }
  }, [reading]);

  const handleWordPeek = (word: ChineseWord) => {
    if (!wordBank.some(w => w.characters === word.characters)) {
      setWordBank(prev => [...prev, word]);
    }
  };

  const handlePrint = () => {
    setShowPrintPreview(true);
    setTimeout(() => {
      window.print();
      setShowPrintPreview(false);
    }, 100);
  };

  const handleThemeChange = (themeId: string) => {
    setCurrentTheme(themeId);
  };

  const toggleQuiz = () => {
    setShowQuiz(prev => !prev);
  };

  const theme = themes.find(t => t.id === currentTheme) || themes[0];
  const wordCount = processedText.filter(word => /[\u4e00-\u9fa5]/.test(word.characters)).length;

  return (
    <div className="app" style={{
      background: theme.colors.background,
      color: theme.colors.text,
      '--theme-primary': theme.colors.primary,
      '--theme-secondary': theme.colors.secondary,
      '--theme-card-bg': theme.colors.cardBackground,
      '--theme-card-border': theme.colors.cardBorder,
      '--theme-highlight': theme.colors.highlight,
    } as React.CSSProperties}>
      <nav className="navigation">
        <Link to="/">阅读</Link>
        <Link to="/articles">文章列表</Link>
      </nav>
      <div className="header">
        <h1>{reading.title}</h1>
        <button 
          className="themeButton" 
          onClick={() => setIsThemePanelOpen(true)}
          title="更换主题"
        >
          {theme.emoji}
        </button>
      </div>
      {reading.author && (
        <div className="meta">
          <span className="author">作者：{reading.author}</span>
          {reading.sourceDate && (
            <span className="date">日期：{reading.sourceDate}</span>
          )}
        </div>
      )}
      {reading.tags.length > 0 && (
        <div className="tags">
          {reading.tags.map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}
      {isLoading && <div>Loading...</div>}
      {error && <div style={{ color: 'red' }}>Error: {error}</div>}
      {!isLoading && !error && processedText.length > 0 && (
        <>
          <ChineseText text={processedText} onWordPeek={handleWordPeek} />
          <div className="wordCount">
            字数：{wordCount}
          </div>
          <div className="actions">
            <button 
              className="actionButton"
              onClick={toggleQuiz}
            >
              {showQuiz ? '隐藏测验' : '开始测验'}
            </button>
          </div>
          {showQuiz && <QuizPanel quizzes={reading.quizzes} />}
          {wordBank.length > 0 && (
            <div className="word-bank">
              <h2>生词本</h2>
              <div className="word-list">
                {wordBank.map((word, index) => (
                  <div key={index} className="word-card">
                    <div className="character">{word.characters}</div>
                    <div className="pinyin">{word.pinyin.join(' ')}</div>
                  </div>
                ))}
              </div>
              <button className="home-button" onClick={handlePrint}>
                打印生词卡
              </button>
            </div>
          )}
        </>
      )}
      {!isLoading && !error && processedText.length === 0 && (
        <div>No text loaded</div>
      )}
      {showPrintPreview && <PrintableCards words={wordBank} />}
      <ThemePanel
        isOpen={isThemePanelOpen}
        onClose={() => setIsThemePanelOpen(false)}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
      />
    </div>
  );
}

function App() {
  useEffect(() => {
    initializeDatabase();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<MainContent />} />
        <Route path="/articles" element={<Articles />} />
      </Routes>
    </Router>
  );
}

export default App
