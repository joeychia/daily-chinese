import { ref, get, set } from 'firebase/database';
import { db } from '../config/firebase';
import { Quiz } from '../types/reading';

interface Article {
  id: string;
  title: string;
  author: string;
  content: string;
  tags: string[];
  isGenerated: boolean;
  generatedDate: string;
  quizzes: Quiz[];
}

export const articleService = {
  getAllArticles: async (): Promise<Article[]> => {
    const articlesRef = ref(db, 'articles');
    const snapshot = await get(articlesRef);
    if (snapshot.exists()) {
      const articles = snapshot.val();
      return Object.values(articles);
    }
    return [];
  },

  getArticleById: async (id: string): Promise<Article | null> => {
    const articleRef = ref(db, `articles/${id}`);
    const snapshot = await get(articleRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  },
}; 