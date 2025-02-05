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
import sampleReading from './data/readings/sample.json'
import { initializeDatabase } from './scripts/initializeDb'
import { articleService, DatabaseArticle } from './services/articleService'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import './App.css'
import { getWordBank, saveWordBank, subscribeToWordBank, getTheme, saveTheme, subscribeToTheme, userDataService } from './services/userDataService'
import { Timer } from './components/Timer'
import { TopBar } from './components/TopBar'
import { WordBankComponent } from './components/WordBankComponent'
import { WordBank } from './components/WordBank'
import { DifficultyDisplay } from './components/DifficultyDisplay'
import { analyticsService } from './services/analyticsService'
import CreateArticle from './pages/CreateArticle'
import { Progress } from './pages/Progress'
import { characterGrades } from './data/characterGrades'
import { calculateStats } from './pages/Progress'
import { ArticleFeedbackPanel } from './components/ArticleFeedbackPanel'
import { Leaderboard } from './pages/Leaderboard'


interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children, allowGuest }: ProtectedRouteProps & { allowGuest?: boolean }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user && !allowGuest) {
    return <Navigate to="/login" />;
  }
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
  const [reading, setReading] = useState<DatabaseArticle>(sampleReading);
  const [showQuiz, setShowQuiz] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [showSavedIndicator, setShowSavedIndicator] = useState(false);
  const { articleId } = useParams();
  const [isReading, setIsReading] = useState<boolean>(true);
  const [lastReadTime, setLastReadTime] = useState<number | undefined>();
  const [streakRefreshCounter, setStreakRefreshCounter] = useState(0);
  const navigate = useNavigate();
  const [isFeedbackPanelOpen, setIsFeedbackPanelOpen] = useState(false);
  const [pointsRefreshTrigger, setPointsRefreshTrigger] = useState(0);

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

  // Load article when articleId changes or on root path
  useEffect(() => {
    const loadArticle = async () => {
      try {
        if (articleId) {
          const article = await articleService.getArticleById(articleId);
          if (!article) {
            setError('Article not found');
            return;
          }
          setReading(article);
          setProcessedText(processChineseText(article.content));
          
          // Track article view with enhanced metrics
          analyticsService.trackArticleView(articleId, article.title, {
            difficulty: article.difficultyLevel,
            wordCount: processChineseText(article.content).length,
            author: article.author,
            tags: article.tags,
            isGenerated: article.isGenerated
          });
        } else {
          // On root path, load first unread or random article
          if (user) {
            const unreadArticle = await articleService.getFirstUnreadArticle(user.id);
            if (unreadArticle) {
              navigate(`/article/${unreadArticle.id}`);
              return;
            }
          }
          // For guest users or if no unread articles, get the first one
          const article = await articleService.getFirstUnreadArticle('guest');
          if (article) {
            navigate(`/article/${article.id}`);
          }
        }
      } catch (error) {
        console.error('Error loading article:', error);
        setError('Failed to load article');
      }
    };

    loadArticle();
  }, [articleId, user, navigate]);

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

  const handleWordPeek = async (word: ChineseWord) => {
    if (!wordBank.some(w => w.characters === word.characters)) {
      setWordBank(prev => [...prev, word]);
      analyticsService.trackWordBankAdd(word.characters, word.pinyin);
    }

    // Update character mastery for each character in the word
    const characters = word.characters.split('');
    await userDataService.updateCharacterMastery(characters, 0);
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

  const handleDeleteWord = (word: ChineseWord) => {
    setWordBank(prev => prev.filter(w => w.characters !== word.characters));
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
      // Save reading time
      await articleService.saveUserArticleData(user.id, articleId, {
        lastReadTime: readingTime
      });

      // Calculate and save daily stats using Progress.tsx's calculateStats
      const masteryData = await userDataService.getCharacterMastery();
      const allChars = Object.values(characterGrades).flat();
      const stats = calculateStats(allChars, masteryData);

      await userDataService.saveDailyStats({
        totalChars: stats.total,
        mastered: stats.mastered,
        familiar: stats.familiar,
        learned: stats.learned,
        notFamiliar: stats.notFamiliar,
        unknown: stats.unknown
      });
      
      // Trigger streak refresh
      setStreakRefreshCounter(prev => prev + 1);

      // Show feedback panel after quiz completion
      setIsFeedbackPanelOpen(true);
    } catch (error) {
      console.error('Error saving reading data:', error);
    }
  };

  const handleFeedbackSubmit = async (feedback: { enjoyment: number; difficulty: number }) => {
    analyticsService.trackArticleFeedback(articleId!, feedback);
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
        refreshTrigger={pointsRefreshTrigger}
        streakRefreshTrigger={streakRefreshCounter}
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
              <>
                <QuizPanel 
                  quizzes={reading.quizzes}
                  onComplete={handleQuizComplete}
                  articleId={articleId || ''}
                  onPointsUpdate={() => setPointsRefreshTrigger(prev => prev + 1)}
                  onClose={() => setShowQuiz(false)}
                />
                
              </>
            )}
            {(!isReading || lastReadTime !== undefined) && (
                  <div className="post-quiz-actions">
                    <button 
                      className="readMoreButton"
                      onClick={async () => {
                        try {
                          if (user?.id) {
                            const nextArticle = await articleService.getFirstUnreadArticle(user.id);
                            if (nextArticle) {
                              // Reset quiz state before navigation
                              setShowQuiz(false);
                              setIsReading(true);
                              navigate(`/article/${nextArticle.id}`);
                            } else {
                              navigate('/articles');
                            }
                          }
                        } catch (error) {
                          console.error('Error navigating to next article:', error);
                        }
                      }}
                    >
                      下一篇
                    </button>
                  </div>
                )}
            {filteredWordBank.length > 0 && (
              <WordBankComponent
                words={filteredWordBank}
                title="本文生词"
                onWordDelete={handleDeleteWord}
                showSavedIndicator={showSavedIndicator}
                onPointsUpdate={() => setPointsRefreshTrigger(prev => prev + 1)}
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
      <ArticleFeedbackPanel
        isOpen={isFeedbackPanelOpen}
        onClose={() => setIsFeedbackPanelOpen(false)}
        onSubmit={handleFeedbackSubmit}
        articleId={articleId!}
      />
    </div>
  );
}

function App() {
  useEffect(() => {
    console.log('App: Initializing database...');
    initializeDatabase();

    // Disable right-click context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
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
              <ProtectedRoute allowGuest>
                <MainContent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/articles"
            element={
              <ProtectedRoute allowGuest>
                <Articles />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create-article"
            element={
              <ProtectedRoute>
                <CreateArticle />
              </ProtectedRoute>
            }
          />
          <Route
            path="/article/:articleId"
            element={
              <ProtectedRoute allowGuest>
                <MainContent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wordbank"
            element={
              <ProtectedRoute allowGuest>
                <WordBank />
              </ProtectedRoute>
            }
          />
          <Route
            path="/progress"
            element={
              <ProtectedRoute>
                <Progress />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <Leaderboard />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App
