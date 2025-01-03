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

  saveUserArticleData: async (
    userId: string, 
    articleId: string, 
    data: Partial<UserArticleData>
  ): Promise<void> => {
    const userArticleRef = ref(db, `users/${userId}/articles/${articleId}`);
    const currentSnapshot = await get(userArticleRef);
    const currentData = currentSnapshot.exists() ? currentSnapshot.val() : {};
    
    // Merge new data with existing data
    const newData = {
      ...currentData,
      ...data,
      // Special handling for reading time to maintain best time
      ...(data.lastReadTime && {
        lastReadTime: data.lastReadTime,
        bestTime: currentData.bestTime && currentData.bestTime < data.lastReadTime 
          ? currentData.bestTime 
          : data.lastReadTime
      })
    };
    
    await set(userArticleRef, newData);
  }
}; 