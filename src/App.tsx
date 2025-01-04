import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useParams, Navigate, useNavigate } from 'react-router-dom'
import { ChineseText } from './components/ChineseText'
import { ThemePanel } from './components/ThemePanel'
import { QuizPanel } from './components/QuizPanel'
import { Menu } from './components/Menu'
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
import { getWordBank, saveWordBank, subscribeToWordBank, getTheme, saveTheme, subscribeToTheme } from './services/userDataService'
import { ConfirmDialog } from './components/ConfirmDialog'
import { Timer } from './components/Timer'
import { TopBar } from './components/TopBar'
import { WordBankComponent } from './components/WordBankComponent'
import { WordBank } from './components/WordBank'
import { analyzeArticleDifficulty } from './utils/articleDifficulty'
import { DifficultyDisplay } from './components/DifficultyDisplay'
import { analyticsService } from './services/analyticsService'

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
const convertArticle = async (article: DatabaseArticle): Promise<Reading> => {
  // Get article with difficulty level from cache or calculate if needed
  const articleWithDifficulty = await articleService.getArticleWithDifficulty(article.id);
  
  return {
    id: article.id,
    title: article.title,
    author: article.author,
    content: article.content,
    tags: article.tags,
    quizzes: article.quizzes?.map(convertQuiz) || [],
    isGenerated: article.isGenerated,
    generatedDate: article.generatedDate,
    sourceDate: article.generatedDate,
    difficultyLevel: articleWithDifficulty.difficultyLevel,
    characterLevels: articleWithDifficulty.characterLevels || analyzeArticleDifficulty(article.content).levelDistribution
  };
};

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
  const [currentTheme, setCurrentTheme] = useState<string | null>(null);
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [reading, setReading] = useState<Reading>(sampleReading);
  const [showQuiz, setShowQuiz] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const { articleId } = useParams();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [wordToDelete, setWordToDelete] = useState<ChineseWord | null>(null);
  const [isReading, setIsReading] = useState<boolean>(true);
  const [lastReadTime, setLastReadTime] = useState<number | undefined>();
  const [streakRefreshCounter, setStreakRefreshCounter] = useState(0);
  const navigate = useNavigate();

  // Process title for pinyin support
  const processedTitle = processChineseText(reading.title);

  // Filter word bank for current article
  const articleWords = processedText.map(word => word.characters);
  const filteredWordBank = wordBank.filter(word => articleWords.includes(word.characters));

  // Load user's word bank
  useEffect(() => {
    if (!user) {
      setWordBank([]);
      return;
    }

    const loadWordBank = async () => {
      try {
        const words = await getWordBank(user.id);
        setWordBank(words);
      } catch (error) {
        console.error('Error loading word bank:', error);
      }
    };
    loadWordBank();

    const unsubscribe = subscribeToWordBank(user.id, (updatedWordBank: ChineseWord[]) => {
      setWordBank(updatedWordBank);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Setup word bank syncing
  useEffect(() => {
    if (!user) return;

    let syncTimeout: NodeJS.Timeout;
    const syncWordBank = async () => {
      try {
        await saveWordBank(user.id, wordBank);
        console.log('Word bank synced successfully:', {
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
      clearTimeout(syncTimeout);
      clearInterval(syncInterval);
    };
  }, [user, wordBank]);

  // Reset start time when article changes
  useEffect(() => {
    setStartTime(Date.now());
  }, [articleId, reading.id]);

  // Initialize database first
  useEffect(() => {
    const init = async () => {
      try {
        await initializeDatabase();
        console.log('Database initialized');
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };
    init();
  }, []);

  // Load article when articleId changes
  useEffect(() => {
    const loadArticle = async () => {
      if (!articleId) return;
      
      try {
        const article = await articleService.getArticleById(articleId);
        if (!article) {
          setError('Article not found');
          return;
        }
        const convertedArticle = await convertArticle(article);
        setReading(convertedArticle);
        setProcessedText(processChineseText(convertedArticle.content));
        
        // Track article view with enhanced metrics
        analyticsService.trackArticleView(articleId, article.title, {
          difficulty: convertedArticle.difficultyLevel,
          wordCount: processChineseText(article.content).length,
          author: article.author,
          tags: article.tags,
          isGenerated: article.isGenerated
        });
      } catch (error) {
        console.error('Error loading article:', error);
        setError('Failed to load article');
      }
    };

    loadArticle();
  }, [articleId]);

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
      setWordBank(prev => [...prev, word]);
      analyticsService.trackWordBankAdd(word.characters, word.pinyin);
    }
  };

  // Load user's theme when they log in
  useEffect(() => {
    if (!user) {
      setCurrentTheme('candy'); // Reset to default theme
      return;
    }

    const loadTheme = async () => {
      try {
        console.log('Loading theme for user:', user.id);
        const theme = await getTheme(user.id);
        console.log('Theme loaded:', theme);
        setCurrentTheme(theme);
      } catch (error) {
        console.error('Error loading theme:', error);
        setCurrentTheme('candy'); // Fallback to default theme on error
      }
    };

    loadTheme();

    // Subscribe to theme changes
    const unsubscribe = subscribeToTheme(user.id, (theme: string) => {
      console.log('Theme updated from subscription:', theme);
      setCurrentTheme(theme);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Save theme when it changes, but only if it's not the initial load
  useEffect(() => {
    if (!user || currentTheme === null) return;

    const saveUserTheme = async () => {
      try {
        console.log('Saving theme to database:', currentTheme);
        await saveTheme(user.id, currentTheme);
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    };
    saveUserTheme();
  }, [user, currentTheme]);

  const handleThemeChange = (themeId: string) => {
    console.log('Changing theme:', {
      from: currentTheme,
      to: themeId,
      theme: themes.find(t => t.id === themeId)?.name
    });
    setCurrentTheme(themeId);
    analyticsService.trackThemeChange(themeId);
  };

  const toggleQuiz = () => {
    console.log(showQuiz ? 'Hiding quiz panel' : 'Showing quiz panel', {
      quizCount: reading.quizzes.length
    });
    setShowQuiz(prev => !prev);
  };

  // Use a default theme while loading
  const theme = themes.find(t => t.id === (currentTheme || 'candy')) || themes[0];
  const wordCount = processedText.filter(word => /[\u4e00-\u9fa5]/.test(word.characters)).length;
  
  // Calculate total unfamiliar words (counting duplicates)
  const unfamiliarWordsCount = processedText.filter(word => 
    /[\u4e00-\u9fa5]/.test(word.characters) && 
    filteredWordBank.some(w => w.characters === word.characters)
  ).length;

  const handleDeleteWord = () => {
    if (wordToDelete) {
      setWordBank(prev => prev.filter(w => w.characters !== wordToDelete.characters));
      setWordToDelete(null);
    }
  };

  // Load last reading time when article changes
  useEffect(() => {
    const loadReadingTime = async () => {
      if (!user || !articleId) return;
      
      try {
        const userData = await articleService.getUserArticleData(user.id, articleId);
        if (userData?.lastReadTime) {
          setLastReadTime(userData.lastReadTime);
        } else {
          setLastReadTime(undefined);
        }
      } catch (error) {
        console.error('Error loading reading time:', error);
      }
    };

    loadReadingTime();
    setIsReading(true);
    setStartTime(Date.now());
  }, [user, articleId]);

  // Handle quiz completion
  const handleQuizComplete = async () => {
    if (!user || !articleId) return;
    
    setIsReading(false);
    const endTime = Date.now();
    const readingTime = endTime - startTime;
    
    try {
      await articleService.saveUserArticleData(user.id, articleId, {
        lastReadTime: readingTime
      });
      // Trigger streak refresh
      setStreakRefreshCounter(prev => prev + 1);
    } catch (error) {
      console.error('Error saving reading time:', error);
    }
  };

  // Load random article for homepage
  useEffect(() => {
    const loadRandomArticle = async () => {
      if (!articleId) {
        try {
          const articles = await articleService.getAllArticles();
          if (articles.length > 0) {
            const randomIndex = Math.floor(Math.random() * articles.length);
            navigate(`/article/${articles[randomIndex].id}`);
          }
        } catch (error) {
          console.error('Error loading random article:', error);
          setError('Failed to load random article');
        }
      }
    };

    loadRandomArticle();
  }, [articleId, navigate]);

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
      <TopBar
        onMenuClick={() => setIsNavOpen(true)}
        onThemeClick={() => setIsThemePanelOpen(true)}
        themeEmoji={theme.emoji}
        refreshTrigger={streakRefreshCounter}
      />
      <div className="content">
        <h1 style={{ margin: 0 }}><ChineseText text={processedTitle} onWordPeek={() => {}} /></h1>
        <div className="article-metadata">
          <span>作者: {reading.author}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', margin: '0.5rem 0' }}>
          <Timer 
            startTime={startTime}
            isRunning={isReading}
            lastReadTime={lastReadTime}
          />
          <span 
            className="difficulty-level" 
            data-level={reading.difficultyLevel}
          >
            难度: {reading.difficultyLevel}
            <div className="difficulty-tooltip">
              <DifficultyDisplay 
                difficultyLevel={reading.difficultyLevel}
                characterLevels={reading.characterLevels}
              />
            </div>
          </span>
          <div>
            识字率：{Math.round((1 - unfamiliarWordsCount / wordCount) * 100)}% of {wordCount}
          </div>
        </div>
        
        {isLoading && <div>Loading...</div>}
        {error && <div style={{ color: 'red' }}>Error: {error}</div>}
        {!isLoading && !error && processedText.length > 0 && (
          <>
            <ChineseText 
              text={processedText} 
              onWordPeek={handleWordPeek} 
              wordBank={wordBank}
            />
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
                onComplete={handleQuizComplete}
              />
            )}
            {filteredWordBank.length > 0 && (
              <WordBankComponent
                words={filteredWordBank}
                title="本文生词"
                onDeleteWord={handleDeleteWord}
                onWordToDelete={setWordToDelete}
                showSavedIndicator={showSavedIndicator}
              />
            )}
          </>
        )}
        {!isLoading && !error && processedText.length === 0 && (
          <div>No text loaded</div>
        )}
      </div>
      <ThemePanel
        isOpen={isThemePanelOpen}
        onClose={() => setIsThemePanelOpen(false)}
        currentTheme={currentTheme || 'candy'}
        onThemeChange={handleThemeChange}
      />
      <Menu
        isOpen={isNavOpen}
        onClose={() => setIsNavOpen(false)}
      />
      <ConfirmDialog
        isOpen={showConfirmDialog}
        message={`确定要删除"${wordToDelete?.characters}"吗？`}
        onConfirm={handleDeleteWord}
        onCancel={() => {
          setShowConfirmDialog(false);
          setWordToDelete(null);
        }}
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
          <Route
            path="/wordbank"
            element={
              <ProtectedRoute>
                <WordBank />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App
