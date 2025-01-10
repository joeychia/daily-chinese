import { getAnalytics, logEvent } from 'firebase/analytics';

class AnalyticsService {
  trackArticleView(articleId: string, title: string, metadata?: {
    difficulty?: number;
    wordCount?: number;
    author?: string;
    tags?: string[];
    isGenerated?: boolean;
  }) {
    logEvent(getAnalytics(), 'article_view', {
      article_id: articleId,
      title,
      ...metadata
    });
  }

  trackWordBankAdd(word: string, pinyin: string[]) {
    logEvent(getAnalytics(), 'word_bank_add', {
      word,
      pinyin: pinyin.join(' ')
    });
  }

  trackQuizCompletion(score: number, total: number) {
    logEvent(getAnalytics(), 'quiz_completion', {
      score,
      total,
      percentage: Math.round((score / total) * 100)
    });
  }

  trackThemeChange(themeId: string) {
    logEvent(getAnalytics(), 'theme_change', {
      theme_id: themeId
    });
  }

  trackArticleFeedback(articleId: string, feedback: { enjoyment: number; difficulty: number }) {
    logEvent(getAnalytics(), 'article_feedback', {
      article_id: articleId,
      enjoyment: feedback.enjoyment,
      difficulty: feedback.difficulty
    });
  }
}

export const analyticsService = new AnalyticsService(); 