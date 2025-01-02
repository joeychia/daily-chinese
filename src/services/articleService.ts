import { ref, set, get, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../config/firebase';

export interface Article {
  id: string;
  title: string;
  author: string;
  content: string;
  tags: string[];
  isGenerated: boolean;
  generatedDate?: string;
  [key: string]: any;
}

export const articleService = {
  // Create or update an article
  async saveArticle(article: Article): Promise<void> {
    const articleRef = ref(db, `articles/${article.id}`);
    await set(articleRef, article);
  },

  // Get all articles
  async getAllArticles(): Promise<Article[]> {
    const articlesRef = ref(db, 'articles');
    const snapshot = await get(articlesRef);
    if (!snapshot.exists()) return [];
    return Object.values(snapshot.val());
  },

  // Get article by ID
  async getArticleById(id: string): Promise<Article | null> {
    const articleRef = ref(db, `articles/${id}`);
    const snapshot = await get(articleRef);
    if (!snapshot.exists()) return null;
    return snapshot.val();
  },

  // Search articles by tag
  async searchByTag(tag: string): Promise<Article[]> {
    const articlesRef = ref(db, 'articles');
    // Firebase Realtime Database doesn't support array queries directly
    // We'll fetch all and filter client-side for tags
    const snapshot = await get(articlesRef);
    if (!snapshot.exists()) return [];
    const articles = Object.values(snapshot.val()) as Article[];
    return articles.filter(article => article.tags.includes(tag));
  },

  // Search articles by title (case-insensitive)
  async searchByTitle(title: string): Promise<Article[]> {
    const articlesRef = ref(db, 'articles');
    const snapshot = await get(articlesRef);
    if (!snapshot.exists()) return [];
    const articles = Object.values(snapshot.val()) as Article[];
    const searchLower = title.toLowerCase();
    return articles.filter(article => 
      article.title.toLowerCase().includes(searchLower)
    );
  }
}; 