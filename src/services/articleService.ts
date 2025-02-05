import { ref, get, set } from 'firebase/database';
import { db } from '../config/firebase';
import { analyzeArticleDifficulty } from '../utils/articleDifficulty';
import { streakService } from './streakService';

export interface DatabaseQuiz {
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface ArticleIndex {
  id: string;
  title: string;
  generatedDate: string;
  visibility: string;
  difficultyLevel: number;
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
  difficultyLevel: number;
  characterLevels: {
    LEVEL_1: number;  // Top 300
    LEVEL_2: number;  // Top 600
    LEVEL_3: number;  // Top 1000
    LEVEL_4: number;  // Top 1500
    LEVEL_5: number;  // Top 2000
    LEVEL_6: number;  // Beyond 2000
  };
}

export interface UserArticleData {
  lastReadTime?: number;
  bestTime?: number;
  quizScores?: number[];
  wordBank?: string[];
  lastReadDate?: string;  // ISO date string
}

export const articleService = {
  getFirstUnreadArticle: async (userId: string): Promise<DatabaseArticle | null> => {
    // Get articles index
    const indexRef = ref(db, 'articlesIndex');
    const indexSnapshot = await get(indexRef);
    const articleIds = indexSnapshot.exists() ? indexSnapshot.val() : [];
    
    // Get user's reading history
    const userArticlesRef = ref(db, `users/${userId}/articles`);
    const historySnapshot = await get(userArticlesRef);
    const readArticles = historySnapshot.exists() ? Object.keys(historySnapshot.val()) : [];
    
    // Find first unread article from the index
    for (const articleMeta of articleIds) {
      // Skip if already read
      if (readArticles.includes(articleMeta.id)) continue;
      
      // Check visibility from index metadata
      if (articleMeta.visibility === 'public' || articleMeta.visibility === userId) {
        // Get the full article content
        const article = await articleService.getArticleById(articleMeta.id);
        if (!article) continue;
        
        return article;
      }
    }
    
    return null;
  },

  createArticle: async (article: DatabaseArticle): Promise<void> => {
    // Save the article
    const articleRef = ref(db, `articles/${article.id}`);
    await set(articleRef, article);

    // Add to index with metadata
    const indexRef = ref(db, 'articlesIndex');
    const indexSnapshot = await get(indexRef);
    const currentIndex = indexSnapshot.exists() ? indexSnapshot.val() : [];
    const analysis = analyzeArticleDifficulty(article.content);
    // Extract metadata for the index
    const newArticleMetadata: ArticleIndex = {
      id: article.id,
      title: article.title,
      visibility: article.visibility,
      generatedDate: article.generatedDate,
      difficultyLevel: analysis.difficultyLevel
    };
    
    // Add article metadata to the index
    await set(indexRef, [...currentIndex, newArticleMetadata]);

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


  getArticleIndex: async (): Promise<ArticleIndex[]> => {
    // Get articles index
    const indexRef = ref(db, 'articlesIndex');
    const indexSnapshot = await get(indexRef);
    const articleIndex = indexSnapshot.exists() ? indexSnapshot.val() : [];
    return articleIndex;
  },

};