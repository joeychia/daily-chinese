import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useParams, Navigate } from 'react-router-dom'
import { ChineseText } from './components/ChineseText'
import { PrintableCards } from './components/PrintableCards'
import { ThemePanel } from './components/ThemePanel'
import { QuizPanel } from './components/QuizPanel'
import { ArticleNav } from './components/ArticleNav'
import { LoginPage } from './components/LoginPage'
import Articles from './components/Articles'
import { ChineseWord } from './data/sampleText'
import { themes } from './config/themes'
import { processChineseText } from './utils/textProcessor'
import { Reading, Quiz } from './types/reading'
import sampleReading from './data/readings/sample.json'
import { initializeDatabase } from './scripts/initializeDb'
import { articleService } from './services/articleService'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import './App.css'
import { UserMenu } from './components/UserMenu'
import { userDataService } from './services/userDataService'
import { ref, get, set } from 'firebase/database'
import { db } from './config/firebase'

// Define the structure of the quiz from the database
interface DatabaseQuiz {
  question: string;
  options: string[];
  correctAnswer: number;
}

interface DatabaseArticle {
  id: string;
  title: string;
  author: string;
  content: string;
  tags: string[];
  isGenerated: boolean;
  generatedDate: string;
  quizzes: DatabaseQuiz[];
}

// Convert database quiz to application quiz
const convertQuiz = (dbQuiz: DatabaseQuiz): Quiz => ({
  question: dbQuiz.question,
  options: dbQuiz.options,
  correctOption: dbQuiz.correctAnswer
});

// Convert database article to application reading
const convertArticle = (article: DatabaseArticle): Reading => ({
  id: article.id,
  title: article.title,
  author: article.author,
  content: article.content,
  tags: article.tags,
  quizzes: article.quizzes?.map(convertQuiz) || [],
  sourceDate: article.generatedDate
});

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  console.log('ProtectedRoute:', { user, loading });

  if (loading) {
    console.log('ProtectedRoute: Loading...');
    return <div>Loading...</div>;
  }

  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" />;
  }

  console.log('ProtectedRoute: User authenticated, rendering children');
  return <>{children}</>;
};

function MainContent() {
  const { user } = useAuth();
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
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const { articleId } = useParams();

  // Process title for pinyin support
  const processedTitle = processChineseText(reading.title);

  // Reset start time when article changes
  useEffect(() => {
    setStartTime(Date.now());
  }, [articleId, reading.id]);

  // Load user's progress when article changes
  useEffect(() => {
    if (!user) {
      // Reset word bank when user is not logged in
      setWordBank([]);
      return;
    }

    const loadProgress = async () => {
      try {
        // Reset word bank first
        setWordBank([]);
        
        if (articleId) {
          // Load article-specific word bank
          const progress = await userDataService.getArticleProgress(user.id, articleId);
          if (progress?.wordBank) {
            setWordBank(progress.wordBank);
          }
        } else {
          // On homepage, load the user's general word bank
          const wordBank = await userDataService.getWordBank(user.id);
          if (wordBank) {
            setWordBank(wordBank);
          }
        }
      } catch (error) {
        console.error('Error loading user progress:', error);
      }
    };
    loadProgress();
  }, [user, articleId, reading.id]);

  // Setup word bank subscription
  useEffect(() => {
    if (!user) return;

    console.log('Setting up word bank subscription');
    // Subscribe to word bank changes
    const unsubscribe = userDataService.subscribeToWordBank(
      user.id,
      articleId || 'general',
      (updatedWordBank) => {
        if (updatedWordBank && updatedWordBank.length > 0) {
          setWordBank(updatedWordBank);
        }
      }
    );

    return () => {
      console.log('Cleaning up word bank subscription');
      unsubscribe();
    };
  }, [user, articleId]); // Only resubscribe when user or articleId changes

  // Setup word bank syncing
  useEffect(() => {
    if (!user) return;

    console.log('Setting up word bank sync interval');
    const syncWordBank = async () => {
      try {
        // Use different paths for article-specific and general word banks
        const path = articleId ? 
          `users/${user.id}/articles/${articleId}` : 
          `users/${user.id}/wordBank`;
        
        const userRef = ref(db, path);
        const snapshot = await get(userRef);
        const existingData = snapshot.val() || {};
        
        // For article-specific word bank, merge with existing data
        if (articleId) {
          await set(userRef, {
            ...existingData,
            wordBank,
          });
        } else {
          // For general word bank, just save the word bank directly
          await set(userRef, wordBank);
        }
        
        console.log('Word bank synced successfully:', {
          articleId: articleId || 'general',
          wordCount: wordBank.length,
          timestamp: new Date().toISOString()
        });
        
        // Show saved indicator for 5 seconds
        setShowSavedIndicator(true);
        setTimeout(() => {
          setShowSavedIndicator(false);
        }, 5000);
      } catch (error) {
        console.error('Error syncing word bank:', error);
      }
    };

    // Start periodic sync
    const syncInterval = setInterval(syncWordBank, 60000); // Sync every minute

    return () => {
      console.log('Cleaning up word bank sync interval');
      clearInterval(syncInterval);
    };
  }, [user, articleId, wordBank, db]);

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
            
            setReading(convertArticle(article));
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
          
          setReading(convertArticle(randomArticle));
        } else if (articles.length > 0) {
          // If no other articles available, use any article
          console.log('No unread articles, using random article from all');
          const randomIndex = Math.floor(Math.random() * articles.length);
          const randomArticle = articles[randomIndex];
          
          localStorage.setItem('lastReadArticleId', randomArticle.id);
          
          setReading(convertArticle(randomArticle));
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

  // Load theme when user logs in
  useEffect(() => {
    if (!user) {
      setCurrentTheme('candy'); // Reset to default theme
      return;
    }

    const loadTheme = async () => {
      try {
        const savedTheme = await userDataService.getTheme(user.id);
        if (savedTheme) {
          setCurrentTheme(savedTheme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();

    // Subscribe to theme changes
    const unsubscribe = userDataService.subscribeToTheme(user.id, (theme) => {
      setCurrentTheme(theme);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  const handleThemeChange = async (themeId: string) => {
    console.log('Changing theme:', {
      from: currentTheme,
      to: themeId,
      theme: themes.find(t => t.id === themeId)?.name
    });
    setCurrentTheme(themeId);

    // Save theme to database
    if (user) {
      try {
        await userDataService.saveTheme(user.id, themeId);
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    }
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
        <div className="spacer" />
        <UserMenu />
      </nav>
      <div className="header">
        <h1><ChineseText text={processedTitle} onWordPeek={() => {}} /></h1>
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
          <ChineseText 
            text={processedText} 
            onWordPeek={handleWordPeek} 
            wordBank={wordBank}
          />
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
          {showQuiz && (
            <QuizPanel 
              quizzes={reading.quizzes} 
              articleId={articleId || reading.id}
              startTime={startTime}
            />
          )}
          {wordBank.length > 0 && (
            <div className="word-bank">
              <h2>
                生词本
                {showSavedIndicator && (
                  <span className="save-status">已保存</span>
                )}
              </h2>
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
    console.log('App: Initializing database...');
    initializeDatabase();
  }, []);

  console.log('App: Rendering');
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainContent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/article/:articleId"
            element={
              <ProtectedRoute>
                <MainContent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/articles"
            element={
              <ProtectedRoute>
                <Articles />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App
