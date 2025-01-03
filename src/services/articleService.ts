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
    console.log('Saving article:', { id: article.id, title: article.title });
    const articleRef = ref(db, `articles/${article.id}`);
    await set(articleRef, article);
    console.log('Article saved successfully');
  },

  // Get all articles
  async getAllArticles(): Promise<Article[]> {
    console.log('Fetching all articles from database...');
    const articlesRef = ref(db, 'articles');
    const snapshot = await get(articlesRef);
    if (!snapshot.exists()) {
      console.log('No articles found in database');
      return [];
    }
    const articles = Object.values(snapshot.val()) as Article[];
    console.log(`Loaded ${articles.length} articles:`, articles.map(a => ({ id: a.id, title: a.title })));
    return articles;
  },

  // Get article by ID
  async getArticleById(id: string): Promise<Article | null> {
    console.log('Fetching article by ID:', id);
    const articleRef = ref(db, `articles/${id}`);
    const snapshot = await get(articleRef);
    if (!snapshot.exists()) {
      console.log('Article not found:', id);
      return null;
    }
    const article = snapshot.val();
    console.log('Found article:', { id: article.id, title: article.title });
    return article;
  },

  // Search articles by tag
  async searchByTag(tag: string): Promise<Article[]> {
    console.log('Searching articles by tag:', tag);
    const articlesRef = ref(db, 'articles');
    // Firebase Realtime Database doesn't support array queries directly
    // We'll fetch all and filter client-side for tags
    const snapshot = await get(articlesRef);
    if (!snapshot.exists()) {
      console.log('No articles found in database');
      return [];
    }
    const articles = Object.values(snapshot.val()) as Article[];
    const filteredArticles = articles.filter(article => article.tags.includes(tag));
    console.log(`Found ${filteredArticles.length} articles with tag "${tag}":`, 
      filteredArticles.map(a => ({ id: a.id, title: a.title })));
    return filteredArticles;
  },

  // Search articles by title (case-insensitive)
  async searchByTitle(title: string): Promise<Article[]> {
    console.log('Searching articles by title:', title);
    const articlesRef = ref(db, 'articles');
    const snapshot = await get(articlesRef);
    if (!snapshot.exists()) {
      console.log('No articles found in database');
      return [];
    }
    const articles = Object.values(snapshot.val()) as Article[];
    const searchLower = title.toLowerCase();
    const filteredArticles = articles.filter(article => 
      article.title.toLowerCase().includes(searchLower)
    );
    console.log(`Found ${filteredArticles.length} articles matching title "${title}":`,
      filteredArticles.map(a => ({ id: a.id, title: a.title })));
    return filteredArticles;
  }
}; 