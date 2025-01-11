import { ref, get, set, increment } from 'firebase/database';
import { db } from '../config/firebase';

interface PointsData {
  total: number;
  wordBankTests: number;
  quizCompletions: number;
  dailyStreak: number;
}

export const rewardsService = {
  async addPoints(userId: string, amount: number, category: keyof PointsData): Promise<void> {
    const pointsRef = ref(db, `users/${userId}/points`);
    const totalPointsRef = ref(db, `users/${userId}/points/total`);
    const categoryPointsRef = ref(db, `users/${userId}/points/${category}`);

    await Promise.all([
      set(totalPointsRef, increment(amount)),
      set(categoryPointsRef, increment(amount))
    ]);
  },

  async getPoints(userId: string): Promise<PointsData> {
    const pointsRef = ref(db, `users/${userId}/points`);
    const snapshot = await get(pointsRef);
    return snapshot.val() || {
      total: 0,
      wordBankTests: 0,
      quizCompletions: 0,
      dailyStreak: 0
    };
  },

  async recordWordBankTest(userId: string, word: string): Promise<void> {
    // Record that this word has been tested today
    const today = new Date().toISOString().split('T')[0];
    const wordTestRef = ref(db, `users/${userId}/wordTests/${word}`);
    const snapshot = await get(wordTestRef);
    
    // If word hasn't been tested today, award points
    if (!snapshot.exists() || snapshot.val() !== today) {
      await Promise.all([
        set(wordTestRef, today),
        this.addPoints(userId, 5, 'wordBankTests')
      ]);
    }
  },

  async recordQuizCompletion(userId: string, articleId: string, questionId: string): Promise<void> {
    // Record that this quiz question has been answered correctly
    const quizRef = ref(db, `users/${userId}/quizCompletions/${articleId}/${questionId}`);
    const snapshot = await get(quizRef);
    
    // If question hasn't been answered correctly before, award points
    if (!snapshot.exists()) {
      await Promise.all([
        set(quizRef, true),
        this.addPoints(userId, 10, 'quizCompletions')
      ]);
    }
  },

  async recordDailyStreak(userId: string): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const streakRef = ref(db, `users/${userId}/lastStreakReward`);
    const snapshot = await get(streakRef);
    
    // If streak hasn't been rewarded today, award points
    if (!snapshot.exists() || snapshot.val() !== today) {
      await Promise.all([
        set(streakRef, today),
        this.addPoints(userId, 15, 'dailyStreak')
      ]);
    }
  }
}; 