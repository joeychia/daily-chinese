import { useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, useParams, Navigate } from 'react-router-dom'
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
const convertArticle = (article: DatabaseArticle): Reading => {
  const analysis = analyzeArticleDifficulty(article.content);
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
    difficultyLevel: analysis.difficultyLevel,
    characterLevels: analysis.levelDistribution
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
  const [currentTheme, setCurrentTheme] = useState<string>('candy');
  const [isThemePanelOpen, setIsThemePanelOpen] = useState(false);
  const [isNavOpen, setIsNavOpen] = useState(false);
  const [reading, setReading] = useState<Reading>(sampleReading);
  const [showQuiz, setShowQuiz] = useState(false);
  const [isDbInitialized, setIsDbInitialized] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const { articleId } = useParams();
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [wordToDelete, setWordToDelete] = useState<ChineseWord | null>(null);
  const [isReading, setIsReading] = useState<boolean>(true);
  const [lastReadTime, setLastReadTime] = useState<number | undefined>();
  const [streakRefreshCounter, setStreakRefreshCounter] = useState(0);

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

  // Load theme when user logs in
  useEffect(() => {
    if (!user) {
      setCurrentTheme('candy'); // Reset to default theme
      return;
    }

    const loadTheme = async () => {
      try {
        const theme = await getTheme(user.id);
        if (theme) {
          setCurrentTheme(theme);
        }
      } catch (error) {
        console.error('Error loading theme:', error);
      }
    };
    loadTheme();

    // Subscribe to theme changes
    const unsubscribe = subscribeToTheme(user.id, (theme: string) => {
      setCurrentTheme(theme);
    });

    return () => {
      unsubscribe();
    };
  }, [user]);

  // Save theme when it changes
  useEffect(() => {
    if (!user) return;

    const saveUserTheme = async () => {
      try {
        await saveTheme(user.id, currentTheme);
      } catch (error) {
        console.error('Error saving theme:', error);
      }
    };
    saveUserTheme();
  }, [user, currentTheme]);

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
        await saveTheme(user.id, themeId);
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
          <span 
            className="difficulty-level" 
            data-level={reading.difficultyLevel}
          >
            难度等级: {reading.difficultyLevel} 
            ({getDifficultyLabel(reading.difficultyLevel)})
            <div className="difficulty-tooltip">
              <div className="level-stat">
                <span>入门字 (1-300):</span>
                <span>{reading.characterLevels.LEVEL_1.toFixed(1)}%</span>
              </div>
              <div className="level-stat-bar">
                <div 
                  className="level-stat-fill" 
                  style={{ 
                    width: `${reading.characterLevels.LEVEL_1}%`,
                    backgroundColor: '#2e7d32'
                  }} 
                />
              </div>
              <div className="level-stat">
                <span>初级字 (301-600):</span>
                <span>{reading.characterLevels.LEVEL_2.toFixed(1)}%</span>
              </div>
              <div className="level-stat-bar">
                <div 
                  className="level-stat-fill" 
                  style={{ 
                    width: `${reading.characterLevels.LEVEL_2}%`,
                    backgroundColor: '#827717'
                  }} 
                />
              </div>
              <div className="level-stat">
                <span>中级字 (601-1000):</span>
                <span>{reading.characterLevels.LEVEL_3.toFixed(1)}%</span>
              </div>
              <div className="level-stat-bar">
                <div 
                  className="level-stat-fill" 
                  style={{ 
                    width: `${reading.characterLevels.LEVEL_3}%`,
                    backgroundColor: '#e65100'
                  }} 
                />
              </div>
              <div className="level-stat">
                <span>高级字 (1001-1500):</span>
                <span>{reading.characterLevels.LEVEL_4.toFixed(1)}%</span>
              </div>
              <div className="level-stat-bar">
                <div 
                  className="level-stat-fill" 
                  style={{ 
                    width: `${reading.characterLevels.LEVEL_4}%`,
                    backgroundColor: '#c62828'
                  }} 
                />
              </div>
              <div className="level-stat">
                <span>专家字 (1501-2000):</span>
                <span>{reading.characterLevels.LEVEL_5.toFixed(1)}%</span>
              </div>
              <div className="level-stat-bar">
                <div 
                  className="level-stat-fill" 
                  style={{ 
                    width: `${reading.characterLevels.LEVEL_5}%`,
                    backgroundColor: '#4e342e'
                  }} 
                />
              </div>
              <div className="level-stat">
                <span>罕见字 (2000+):</span>
                <span>{reading.characterLevels.LEVEL_6.toFixed(1)}%</span>
              </div>
              <div className="level-stat-bar">
                <div 
                  className="level-stat-fill" 
                  style={{ 
                    width: `${reading.characterLevels.LEVEL_6}%`,
                    backgroundColor: '#757575'
                  }} 
                />
              </div>
            </div>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', margin: '0.5rem 0' }}>
          <Timer 
            startTime={startTime}
            isRunning={isReading}
            lastReadTime={lastReadTime}
          />
          <div>
            识字率：{Math.round((1 - unfamiliarWordsCount / wordCount) * 100)}% of {wordCount}
          </div>
        </div>
        {reading.author && (
          <div className="meta">
            <span className="author">作者：{reading.author}</span>
            {reading.sourceDate && (
              <span className="date">日期：{reading.sourceDate}</span>
            )}
          </div>
        )}
        {reading.tags && reading.tags.map((tag: string, index: number) => (
          <span key={index} className="tag">
            {tag}
          </span>
        ))}
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
                articleId={articleId || reading.id}
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
        currentTheme={currentTheme}
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

const getDifficultyLabel = (level: number): string => {
  switch (level) {
    case 1:
      return '入门';
    case 2:
      return '初级';
    case 3:
      return '中级';
    case 4:
      return '高级';
    case 5:
      return '专家';
    default:
      return '未知';
  }
};

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
