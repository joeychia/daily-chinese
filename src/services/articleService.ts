import { ref, get, set, update } from 'firebase/database';
import { db } from '../config/firebase';
import { analyzeArticleDifficulty } from '../utils/articleDifficulty';
import { streakService } from './streakService';

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
  createdBy?: string;  // Name of the user who created the article
  visibility: string;
}

export interface UserArticleData {
  lastReadTime?: number;
  bestTime?: number;
  quizScores?: number[];
  wordBank?: string[];
  lastReadDate?: string;  // ISO date string
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

  createArticle: async (article: DatabaseArticle): Promise<void> => {
    const articleRef = ref(db, `articles/${article.id}`);
    await set(articleRef, article);
    // Calculate and sync difficulty level
    await articleService.calculateAndSyncDifficulty(article.id, article.content);
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
    
    const today = new Date().toLocaleDateString('en-CA');
    
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
      await streakService.updateUserStreak(userId);
    }
  },

  // Calculate and sync article difficulty level
  calculateAndSyncDifficulty: async (articleId: string, content: string) => {
    try {
      const analysis = analyzeArticleDifficulty(content);
      
      // Update the article with both difficulty level and character levels
      const articleRef = ref(db, `articles/${articleId}`);
      await update(articleRef, { 
        difficultyLevel: analysis.difficultyLevel,
        characterLevels: analysis.levelDistribution
      });
      
      return analysis;
    } catch (error) {
      console.error('Error calculating/syncing difficulty level:', error);
      throw error;
    }
  },

  // Get article with difficulty level, calculate if not present
  getArticleWithDifficulty: async (articleId: string) => {
    try {
      const articleRef = ref(db, `articles/${articleId}`);
      const snapshot = await get(articleRef);
      
      if (!snapshot.exists()) {
        throw new Error('Article not found');
      }

      const article = snapshot.val();
      
      // If difficulty level or character levels don't exist, calculate and sync them
      if (article.difficultyLevel === undefined || article.characterLevels === undefined) {
        const analysis = await articleService.calculateAndSyncDifficulty(articleId, article.content);
        article.difficultyLevel = analysis.difficultyLevel;
        article.characterLevels = analysis.levelDistribution;
      }

      return article;
    } catch (error) {
      console.error('Error getting article with difficulty:', error);
      throw error;
    }
  }
}; 