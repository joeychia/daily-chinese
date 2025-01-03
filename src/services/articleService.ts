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
  completedDates: string[];  // Array of ISO date strings for completed days
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

  async updateUserStreak(userId: string): Promise<void> {
    const streakRef = ref(db, `users/${userId}/streak`);
    const snapshot = await get(streakRef);
    const today = new Date().toISOString().split('T')[0];

    if (!snapshot.exists()) {
      // Initialize streak for first-time user
      await set(streakRef, {
        currentStreak: 1,
        longestStreak: 1,
        lastReadDate: today,
        streakStartDate: today,
        completedDates: [today]
      });
      return;
    }

    const currentStreak = snapshot.val();
    if (currentStreak.lastReadDate === today) {
      // Already read today, maintain current streak
      // Ensure today's date is in completedDates without duplicates
      const completedDates = currentStreak.completedDates || [];
      if (!completedDates.includes(today)) {
        completedDates.push(today);
      }
      await set(streakRef, {
        ...currentStreak,
        completedDates
      });
      return;
    }

    // Check if the last read was yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (currentStreak.lastReadDate === yesterdayStr) {
      // Maintain streak
      const newStreak = currentStreak.currentStreak + 1;
      const longestStreak = Math.max(newStreak, currentStreak.longestStreak);
      // Add today's date to completedDates if not already present
      const completedDates = [...(currentStreak.completedDates || [])];
      if (!completedDates.includes(today)) {
        completedDates.push(today);
      }

      await set(streakRef, {
        ...currentStreak,
        currentStreak: newStreak,
        longestStreak,
        lastReadDate: today,
        completedDates
      });
    } else {
      // Break streak and start new one
      await set(streakRef, {
        ...currentStreak,
        currentStreak: 1,
        lastReadDate: today,
        streakStartDate: today,
        completedDates: [today]
      });
    }
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