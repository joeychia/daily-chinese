import { ref, get, set, increment, update } from 'firebase/database';
import { db } from '../config/firebase';

export interface PointsData {
  total: number;
  wordBank: number;
  quiz: number;
  streak: number;
  creation: number;
}

const defaultPointsData = {
  total: 0,
  wordBank: 0,
  quiz: 0,
  streak: 0,
  creation: 0
};

export const rewardsService = {
  async addPoints(userId: string, amount: number, category: keyof PointsData): Promise<void> {
    const totalPointsRef = ref(db, `users/${userId}/points/total`);
    const categoryPointsRef = ref(db, `users/${userId}/points/${category}`);
    const leaderboardRef = ref(db, `leaderboard/${userId}`);
    
    // First update the user's points
    await Promise.all([
      set(totalPointsRef, increment(amount)),
      set(categoryPointsRef, increment(amount))
    ]);

    // Get the updated total points
    const pointsSnapshot = await get(totalPointsRef);
    const totalPoints = pointsSnapshot.val() || 0;

    // Get existing leaderboard entry to preserve the name
    const leaderboardSnapshot = await get(leaderboardRef);
    const existingData = leaderboardSnapshot.val() || {};
    
    // Sync the total points to leaderboard while preserving the name
    await set(leaderboardRef, {
      ...existingData,
      points: totalPoints
    })
  },

  async getPoints(userId: string): Promise<PointsData> {
    const pointsRef = ref(db, `users/${userId}/points`);
    const snapshot = await get(pointsRef);
    return snapshot.val() || defaultPointsData;
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
        this.addPoints(userId, 1, 'wordBank')
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
        this.addPoints(userId, 10, 'quiz')
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
        this.addPoints(userId, 15, 'streak')
      ]);
    }
  }
};