import { ref, get, set, increment } from 'firebase/database';
import { db } from '../config/firebase';

export interface PointsData {
  total: number;
  wordBank: number;
  quiz: number;
  streak: number;
  creation: number;
  weeklyPoints?: number;
  monthlyPoints?: number;
  lastUpdated?: string;
}

const defaultPointsData = {
  total: 0,
  wordBank: 0,
  quiz: 0,
  streak: 0,
  creation: 0
};

export const rewardsService = {
  async syncToLeaderboard(userId: string, points: number, name?: string): Promise<void> {
    const now = new Date();
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const leaderboardRef = ref(db, `leaderboard/${userId}`);
    const leaderboardSnapshot = await get(leaderboardRef);
    const existingData = leaderboardSnapshot.val() || {};
    
    // Reset weekly/monthly points if needed
    const lastUpdated = existingData.lastUpdated ? new Date(existingData.lastUpdated) : null;
    const weeklyPoints = lastUpdated && lastUpdated >= startOfWeek ? (existingData.weeklyPoints || 0) : 0;
    const monthlyPoints = lastUpdated && lastUpdated >= startOfMonth ? (existingData.monthlyPoints || 0) : 0;
    
    await set(leaderboardRef, {
      ...existingData,
      points,
      weeklyPoints: weeklyPoints + points - (existingData.points || 0),
      monthlyPoints: monthlyPoints + points - (existingData.points || 0),
      lastUpdated: now.toISOString(),
      ...(name && { name })
    });
  },

  async addPoints(userId: string, amount: number, category: keyof PointsData): Promise<void> {
    const totalPointsRef = ref(db, `users/${userId}/points/total`);
    const categoryPointsRef = ref(db, `users/${userId}/points/${category}`);
    
    // First update the user's points
    await Promise.all([
      set(totalPointsRef, increment(amount)),
      set(categoryPointsRef, increment(amount))
    ]);

    // Get the updated total points
    const pointsSnapshot = await get(totalPointsRef);
    const totalPoints = pointsSnapshot.val() || 0;

    // Sync the total points to leaderboard
    await this.syncToLeaderboard(userId, totalPoints);
  },

  async getPoints(userId: string): Promise<PointsData> {
    const pointsRef = ref(db, `users/${userId}/points`);
    const snapshot = await get(pointsRef);
    return snapshot.val() || defaultPointsData;
  },

  async getLeaderboardByPeriod(period: 'all' | 'week' | 'month'): Promise<Array<{ id: string; name: string; points: number }>> {
    const leaderboardRef = ref(db, 'leaderboard');
    const snapshot = await get(leaderboardRef);
    if (!snapshot.exists()) return [];

    const data = snapshot.val();
    const entries = Object.entries(data).map(([id, userData]: [string, any]) => ({
      id,
      name: userData.name || 'Anonymous',
      points: period === 'week' ? (userData.weeklyPoints || 0) :
             period === 'month' ? (userData.monthlyPoints || 0) :
             userData.points || 0
    }));

    return entries.sort((a, b) => b.points - a.points);
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