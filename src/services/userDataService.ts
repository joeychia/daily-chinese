import { ref, set, get, onValue } from 'firebase/database';
import { db } from '../config/firebase';
import { ChineseWord } from '../data/sampleText';

export interface ArticleProgress {
  readingDuration: number;  // in seconds
  quizScore?: number;      // score out of 100
  completedAt?: string;    // ISO date string
  wordBank: ChineseWord[];
}

export interface UserData {
  articles: {
    [articleId: string]: ArticleProgress;
  };
  wordBank?: ChineseWord[]; // General word bank for the user
  theme?: string; // User's theme preference
}

export const userDataService = {
  // Get user's theme preference
  getTheme: async (userId: string): Promise<string | null> => {
    const userRef = ref(db, `users/${userId}/theme`);
    const snapshot = await get(userRef);
    return snapshot.val();
  },

  // Save user's theme preference
  saveTheme: async (userId: string, theme: string): Promise<void> => {
    const userRef = ref(db, `users/${userId}/theme`);
    await set(userRef, theme);
  },

  // Subscribe to theme changes
  subscribeToTheme: (
    userId: string,
    callback: (theme: string) => void
  ) => {
    console.log('Setting up theme subscription');
    const themeRef = ref(db, `users/${userId}/theme`);
    return onValue(themeRef, (snapshot) => {
      const theme = snapshot.val();
      if (theme) {
        console.log('Theme updated from server:', theme);
        callback(theme);
      }
    });
  },

  // Get user's general word bank
  getWordBank: async (userId: string): Promise<ChineseWord[]> => {
    const userRef = ref(db, `users/${userId}/wordBank`);
    const snapshot = await get(userRef);
    return snapshot.val() || [];
  },

  // Save article progress
  saveArticleProgress: async (
    userId: string,
    articleId: string,
    progress: Partial<ArticleProgress>
  ) => {
    const userArticleRef = ref(db, `users/${userId}/articles/${articleId}`);
    
    // Get existing data first
    const snapshot = await get(userArticleRef);
    const existingData = snapshot.val() || {};
    
    // Merge with new data
    const updatedData = {
      ...existingData,
      ...progress,
    };

    await set(userArticleRef, updatedData);
  },

  // Get article progress
  getArticleProgress: async (
    userId: string,
    articleId: string
  ): Promise<ArticleProgress | null> => {
    const userArticleRef = ref(db, `users/${userId}/articles/${articleId}`);
    const snapshot = await get(userArticleRef);
    return snapshot.val();
  },

  // Save word bank with debounce
  setupWordBankSync: (
    userId: string,
    articleId: string,
    wordBank: ChineseWord[],
    onSyncComplete?: (syncedWords: ChineseWord[]) => void
  ) => {
    let timeout: NodeJS.Timeout;
    let lastSyncedWordBank = JSON.stringify(wordBank);
    
    // Return the function to save word bank
    return () => {
      // Only sync if word bank has changed
      const currentWordBank = JSON.stringify(wordBank);
      if (currentWordBank === lastSyncedWordBank) {
        return;
      }
      
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        try {
          // Use different paths for article-specific and general word banks
          const path = articleId === 'general' ? 
            `users/${userId}/wordBank` : 
            `users/${userId}/articles/${articleId}`;
          
          const userRef = ref(db, path);
          const snapshot = await get(userRef);
          const existingData = snapshot.val() || {};
          
          // For general word bank, just save the word bank directly
          if (articleId === 'general') {
            await set(userRef, wordBank);
          } else {
            // For article-specific word bank, merge with existing data
            await set(userRef, {
              ...existingData,
              wordBank,
            });
          }
          
          lastSyncedWordBank = currentWordBank;
          console.log('Word bank synced successfully:', {
            articleId,
            wordCount: wordBank.length
          });
          
          // Call the callback with synced words
          onSyncComplete?.(wordBank);
        } catch (error) {
          console.error('Error syncing word bank:', error);
        }
      }, 60000); // 1 minute delay
    };
  },

  // Subscribe to word bank changes
  subscribeToWordBank: (
    userId: string,
    articleId: string,
    callback: (wordBank: ChineseWord[]) => void
  ) => {
    console.log('Setting up word bank subscription:', { articleId });
    // Use different paths for article-specific and general word banks
    const path = articleId === 'general' ? 
      `users/${userId}/wordBank` : 
      `users/${userId}/articles/${articleId}/wordBank`;
    
    const wordBankRef = ref(db, path);
    return onValue(wordBankRef, (snapshot) => {
      const wordBank = snapshot.val() || [];
      console.log('Word bank updated from server:', {
        articleId,
        wordCount: wordBank.length
      });
      callback(wordBank);
    });
  },

  // Save quiz score and reading duration
  saveQuizCompletion: async (
    userId: string,
    articleId: string,
    score: number,
    duration: number
  ) => {
    await userDataService.saveArticleProgress(userId, articleId, {
      quizScore: score,
      readingDuration: duration,
      completedAt: new Date().toISOString(),
    });
  },
}; 