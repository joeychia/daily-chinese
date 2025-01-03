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
}

export const userDataService = {
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
    wordBank: ChineseWord[]
  ) => {
    let timeout: NodeJS.Timeout;
    
    // Return the function to save word bank
    return () => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        const userArticleRef = ref(db, `users/${userId}/articles/${articleId}`);
        const snapshot = await get(userArticleRef);
        const existingData = snapshot.val() || {};
        
        await set(userArticleRef, {
          ...existingData,
          wordBank,
        });
      }, 60000); // 1 minute delay
    };
  },

  // Subscribe to word bank changes
  subscribeToWordBank: (
    userId: string,
    articleId: string,
    callback: (wordBank: ChineseWord[]) => void
  ) => {
    const wordBankRef = ref(db, `users/${userId}/articles/${articleId}/wordBank`);
    return onValue(wordBankRef, (snapshot) => {
      const wordBank = snapshot.val() || [];
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