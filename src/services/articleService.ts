import { ref, get, set } from 'firebase/database';
import { db } from '../config/firebase';

interface DatabaseQuiz {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface DatabaseArticle {
  id: string;
  title: string;
  author: string;
  content: string;
  tags: string[];
  isGenerated: boolean;
  generatedDate: string;
  quizzes: DatabaseQuiz[];
}

export interface UserArticleData {
  lastReadTime?: number;
  bestTime?: number;
  quizScores?: number[];
  wordBank?: string[];
  lastReadDate?: string;  // ISO date string
}

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastReadDate: string;  // ISO date string
  streakStartDate: string;  // ISO date string
}

export const articleService = {
  getAllArticles: async (): Promise<DatabaseArticle[]> => {
    const articlesRef = ref(db, 'articles');
    const snapshot = await get(articlesRef);
    if (snapshot.exists()) {
      const articles = snapshot.val();
      return Object.values(articles);
    }
    return [];
  },

  getArticleById: async (id: string): Promise<DatabaseArticle | null> => {
    const articleRef = ref(db, `articles/${id}`);
    const snapshot = await get(articleRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  },

  getUserArticleData: async (userId: string, articleId: string): Promise<UserArticleData | null> => {
    const userArticleRef = ref(db, `users/${userId}/articles/${articleId}`);
    const snapshot = await get(userArticleRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  },

  getUserStreak: async (userId: string): Promise<UserStreak | null> => {
    const streakRef = ref(db, `users/${userId}/streak`);
    const snapshot = await get(streakRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  },

  updateUserStreak: async (userId: string): Promise<UserStreak> => {
    const streakRef = ref(db, `users/${userId}/streak`);
    const snapshot = await get(streakRef);
    const today = new Date().toISOString().split('T')[0];
    
    let streak: UserStreak;
    if (snapshot.exists()) {
      const currentStreak = snapshot.val() as UserStreak;
      const lastReadDate = new Date(currentStreak.lastReadDate);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      if (today === currentStreak.lastReadDate) {
        // Already read today, maintain streak
        streak = currentStreak;
      } else if (yesterday.toISOString().split('T')[0] === currentStreak.lastReadDate) {
        // Read yesterday, increment streak
        streak = {
          ...currentStreak,
          currentStreak: currentStreak.currentStreak + 1,
          longestStreak: Math.max(currentStreak.currentStreak + 1, currentStreak.longestStreak),
          lastReadDate: today
        };
      } else {
        // Streak broken, start new streak
        streak = {
          currentStreak: 1,
          longestStreak: currentStreak.longestStreak,
          lastReadDate: today,
          streakStartDate: today
        };
      }
    } else {
      // First time reading, initialize streak
      streak = {
        currentStreak: 1,
        longestStreak: 1,
        lastReadDate: today,
        streakStartDate: today
      };
    }
    
    await set(streakRef, streak);
    return streak;
  },

  saveUserArticleData: async (
    userId: string, 
    articleId: string, 
    data: Partial<UserArticleData>
  ): Promise<void> => {
    const userArticleRef = ref(db, `users/${userId}/articles/${articleId}`);
    const currentSnapshot = await get(userArticleRef);
    const currentData = currentSnapshot.exists() ? currentSnapshot.val() : {};
    
    const today = new Date().toISOString().split('T')[0];
    
    // Merge new data with existing data
    const newData = {
      ...currentData,
      ...data,
      lastReadDate: today,
      // Special handling for reading time to maintain best time
      ...(data.lastReadTime && {
        lastReadTime: data.lastReadTime,
        bestTime: currentData.bestTime && currentData.bestTime < data.lastReadTime 
          ? currentData.bestTime 
          : data.lastReadTime
      })
    };
    
    await set(userArticleRef, newData);
    
    // Update streak when article is completed
    if (data.lastReadTime) {
      await articleService.updateUserStreak(userId);
    }
  }
}; 