declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void;
  }
}

export const analyticsService = {
  trackArticleView: (articleId: string, title: string, metadata?: {
    difficulty?: number;
    wordCount?: number;
    author?: string;
    tags?: string[];
    isGenerated?: boolean;
  }) => {
    window.gtag('event', 'article_view', {
      article_id: articleId,
      article_title: title,
      difficulty_level: metadata?.difficulty,
      word_count: metadata?.wordCount,
      author: metadata?.author,
      tags: metadata?.tags?.join(','),
      is_generated: metadata?.isGenerated,
      timestamp: new Date().toISOString()
    });
  },

  trackWordBankAdd: (word: string, pinyin: string[]) => {
    window.gtag('event', 'word_bank_add', {
      word,
      pinyin: pinyin.join(' ')
    });
  },

  trackQuizCompletion: (score: number, totalQuestions: number) => {
    window.gtag('event', 'quiz_completion', {
      score,
      total_questions: totalQuestions,
      percentage: Math.round((score / totalQuestions) * 100)
    });
  },

  trackThemeChange: (newTheme: string) => {
    window.gtag('event', 'theme_change', {
      theme: newTheme
    });
  }
}; 