import { describe, it, expect, vi, beforeEach } from 'vitest';
import { articleService, DatabaseArticle, UserArticleData } from '../articleService';
import { get, set, update } from 'firebase/database';
import { analyzeArticleDifficulty } from '../../utils/articleDifficulty';

// Mock Firebase
vi.mock('firebase/database', () => ({
  ref: vi.fn(() => ({})),
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn()
}));

vi.mock('../../config/firebase', () => ({
  db: {}
}));

vi.mock('../../utils/articleDifficulty', () => ({
  analyzeArticleDifficulty: vi.fn()
}));

// Mock streakService
vi.mock('../streakService', () => ({
  streakService: {
    updateUserStreak: vi.fn()
  }
}));

describe('articleService', () => {
  const mockArticle: DatabaseArticle = {
    id: 'test-article-1',
    title: 'Test Article',
    author: 'Test Author',
    content: '这是一个测试文章',
    tags: ['test'],
    isGenerated: false,
    generatedDate: '2024-01-01',
    quizzes: [],
    visibility: 'public'
  };

  const mockUserArticleData: UserArticleData = {
    lastReadTime: 100,
    bestTime: 90,
    quizScores: [80, 90, 100],
    wordBank: ['测试', '文章'],
    lastReadDate: '2024-01-01'
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllArticles', () => {
    it('should return empty array when no articles exist', async () => {
      (get as any).mockResolvedValueOnce({ exists: () => false });
      const articles = await articleService.getAllArticles();
      expect(articles).toEqual([]);
    });

    it('should return array of articles when they exist', async () => {
      const mockArticles = {
        'article-1': mockArticle,
        'article-2': { ...mockArticle, id: 'article-2' }
      };
      (get as any).mockResolvedValueOnce({
        exists: () => true,
        val: () => mockArticles
      });

      const articles = await articleService.getAllArticles();
      expect(articles).toHaveLength(2);
      expect(articles[0]).toEqual(mockArticle);
    });
  });

  describe('getArticleById', () => {
    it('should return null when article does not exist', async () => {
      (get as any).mockResolvedValueOnce({ exists: () => false });
      const article = await articleService.getArticleById('non-existent');
      expect(article).toBeNull();
    });

    it('should return article when it exists', async () => {
      (get as any).mockResolvedValueOnce({
        exists: () => true,
        val: () => mockArticle
      });

      const article = await articleService.getArticleById(mockArticle.id);
      expect(article).toEqual(mockArticle);
    });
  });

  describe('getUserArticleData', () => {
    it('should return null when user has not read article', async () => {
      (get as any).mockResolvedValueOnce({ exists: () => false });
      const data = await articleService.getUserArticleData('user-1', 'article-1');
      expect(data).toBeNull();
    });

    it('should return user article data when it exists', async () => {
      (get as any).mockResolvedValueOnce({
        exists: () => true,
        val: () => mockUserArticleData
      });

      const data = await articleService.getUserArticleData('user-1', 'article-1');
      expect(data).toEqual(mockUserArticleData);
    });
  });

  describe('saveUserArticleData', () => {
    it('should merge new data with existing data and update last read date', async () => {
      const today = new Date().toLocaleDateString('en-CA');
      const newData = { lastReadTime: 120 };
      
      (get as any).mockResolvedValueOnce({
        exists: () => true,
        val: () => mockUserArticleData
      });

      await articleService.saveUserArticleData('user-1', 'article-1', newData);

      expect(set).toHaveBeenCalledWith({}, {
        ...mockUserArticleData,
        ...newData,
        lastReadDate: today,
        bestTime: mockUserArticleData.bestTime // should keep existing best time since new time is worse
      });
    });

    it('should update best time when new time is better', async () => {
      const today = new Date().toLocaleDateString('en-CA');
      const newData = { lastReadTime: 80 }; // Better than existing bestTime of 90
      
      (get as any).mockResolvedValueOnce({
        exists: () => true,
        val: () => mockUserArticleData
      });

      await articleService.saveUserArticleData('user-1', 'article-1', newData);

      expect(set).toHaveBeenCalledWith({}, {
        ...mockUserArticleData,
        ...newData,
        lastReadDate: today,
        bestTime: 80 // should update to new best time
      });
    });
  });

  describe('calculateAndSyncDifficulty', () => {
    it('should calculate and update article difficulty', async () => {
      const mockAnalysis = {
        difficultyLevel: 2,
        levelDistribution: { '1': 0.5, '2': 0.3, '3': 0.2 }
      };

      (analyzeArticleDifficulty as any).mockReturnValue(mockAnalysis);

      await articleService.calculateAndSyncDifficulty('article-1', '这是测试文章');

      expect(update).toHaveBeenCalledWith({}, {
        difficultyLevel: mockAnalysis.difficultyLevel,
        characterLevels: mockAnalysis.levelDistribution
      });
    });
  });
}); 