import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom'
import { ChineseText } from './components/ChineseText'
import { PrintableCards } from './components/PrintableCards'
import { ThemePanel } from './components/ThemePanel'
import { QuizPanel } from './components/QuizPanel'
import { ArticleNav } from './components/ArticleNav'
import Articles from './components/Articles'
import { ChineseWord } from './data/sampleText'
import { themes } from './config/themes'
import { processChineseText } from './utils/textProcessor'
import { Reading } from './types/reading'
import sampleReading from './data/readings/sample.json'
import { initializeDatabase } from './scripts/initializeDb'
import { articleService } from './services/articleService'
import './App.css'

function MainContent() {
  const [processedText, setProcessedText] = useState<ChineseWord[]>([]);
  const [wordBank, setWordBank] = useState<ChineseWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [currentTheme, setCurrentTheme] = useState<string>('candy');
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [reading, setReading] = useState<Reading>(sampleReading);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const { articleId } = useParams();

  // Initialize database first
  useEffect(() => {
    const init = async () => {
      try {
        await initializeDatabase();
        console.log('Database initialized');
        setIsDbInitialized(true);
      } catch (error) {
        console.error('Failed to initialize database:', error);
        // Still set as initialized to allow loading sample
        setIsDbInitialized(true);
      }
    };
    init();
  }, []);

  // Load article based on ID or random if none specified
  useEffect(() => {
    if (!isDbInitialized) {
      console.log('Waiting for database initialization...');
      return;
    }

    const loadArticle = async () => {
      console.log('Loading article...', { articleId });
      try {
        if (articleId) {
          // Load specific article
          const article = await articleService.getArticleById(articleId);
          if (article) {
            console.log('Successfully loaded article:', {
              id: article.id,
              title: article.title
            });
            
            const articleAsReading: Reading = {
              id: article.id,
              title: article.title,
              author: article.author,
              content: article.content,
              tags: article.tags,
              quizzes: article.quizzes || [],
              sourceDate: article.generatedDate
            };
            
            setReading(articleAsReading);
            return;
          }
        }

        // Load random article if no ID or article not found
        const articles = await articleService.getAllArticles();
        
        // Get last read article ID from localStorage
        const lastReadId = localStorage.getItem('lastReadArticleId');
        console.log('Last read article ID:', lastReadId);
        
        // Filter out the last read article and get available articles
        const availableArticles = articles.filter(article => article.id !== lastReadId);
        console.log('Available articles:', availableArticles.length);

        if (availableArticles.length > 0) {
          // Get a random article from the filtered list
          const randomIndex = Math.floor(Math.random() * availableArticles.length);
          const randomArticle = availableArticles[randomIndex];
          console.log('Successfully loaded random article:', {
            id: randomArticle.id,
            title: randomArticle.title,
            isGenerated: randomArticle.isGenerated
          });
          
          // Save this article's ID as the last read
          localStorage.setItem('lastReadArticleId', randomArticle.id);
          
          // Convert Article to Reading format
          const articleAsReading: Reading = {
            id: randomArticle.id,
            title: randomArticle.title,
            author: randomArticle.author,
            content: randomArticle.content,
            tags: randomArticle.tags,
            quizzes: randomArticle.quizzes || [],
            sourceDate: randomArticle.generatedDate
          };
          
          setReading(articleAsReading);
        } else if (articles.length > 0) {
          // If no other articles available, use any article
          console.log('No unread articles, using random article from all');
          const randomIndex = Math.floor(Math.random() * articles.length);
          const randomArticle = articles[randomIndex];
          
          localStorage.setItem('lastReadArticleId', randomArticle.id);
          
          const articleAsReading: Reading = {
            id: randomArticle.id,
            title: randomArticle.title,
            author: randomArticle.author,
            content: randomArticle.content,
            tags: randomArticle.tags,
            quizzes: randomArticle.quizzes || [],
            sourceDate: randomArticle.generatedDate
          };
          
          setReading(articleAsReading);
        } else {
          console.log('No articles found in database, falling back to sample reading');
          localStorage.removeItem('lastReadArticleId');
          setReading(sampleReading);
        }
      } catch (error) {
        console.error('Error loading article:', error);
        console.log('Falling back to sample reading');
        localStorage.removeItem('lastReadArticleId');
        setReading(sampleReading);
      }
    };

    loadArticle();
  }, [isDbInitialized, articleId]);

  useEffect(() => {
    console.log('Loading reading content:', { 
      title: reading.title, 
      author: reading.author,
      tags: reading.tags,
      contentLength: reading.content.length,
      quizCount: reading.quizzes.length
    });
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Processing text content...');
      const processed = processChineseText(reading.content);
      console.log('Text processed successfully:', {
        totalWords: processed.length,
        chineseCharacters: processed.filter(word => /[\u4e00-\u9fa5]/.test(word.characters)).length,
        firstFewWords: processed.slice(0, 3).map(w => w.characters).join('')
      });
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
      console.log('Adding word to word bank:', {
        character: word.characters,
        pinyin: word.pinyin.join(' ')
      });
      setWordBank(prev => [...prev, word]);
    }
  };

  const handlePrint = () => {
    console.log('Preparing to print word bank cards:', {
      wordCount: wordBank.length,
      words: wordBank.map(w => w.characters).join(', ')
    });
    setShowPrintPreview(true);
    setTimeout(() => {
      window.print();
      setShowPrintPreview(false);
    }, 100);
  };

  const handleThemeChange = (themeId: string) => {
    console.log('Changing theme:', {
      from: currentTheme,
      to: themeId,
      theme: themes.find(t => t.id === themeId)?.name
    });
    setCurrentTheme(themeId);
  };

  const toggleQuiz = () => {
    console.log(showQuiz ? 'Hiding quiz panel' : 'Showing quiz panel', {
      quizCount: reading.quizzes.length
    });
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
        <button className="navButton" onClick={() => setIsNavOpen(true)}>☰</button>
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
      <ArticleNav
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
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
        <Route path="/article/:articleId" element={<MainContent />} />
        <Route path="/articles" element={<Articles />} />
      </Routes>
    </Router>
  );
}

export default App
