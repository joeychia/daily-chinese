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

export interface ReadingTime {
  lastReadTime: number;
  bestTime?: number;
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

  getReadingTime: async (userId: string, articleId: string): Promise<ReadingTime | null> => {
    const readingTimeRef = ref(db, `users/${userId}/readingTimes/${articleId}`);
    const snapshot = await get(readingTimeRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  },

  saveReadingTime: async (userId: string, articleId: string, time: number): Promise<void> => {
    const readingTimeRef = ref(db, `users/${userId}/readingTimes/${articleId}`);
    const currentData = await get(readingTimeRef);
    const currentTime = currentData.exists() ? currentData.val() : null;
    
    const newData: ReadingTime = {
      lastReadTime: time,
      bestTime: currentTime?.bestTime && currentTime.bestTime < time 
        ? currentTime.bestTime 
        : time
    };
    
    await set(readingTimeRef, newData);
  }
}; 