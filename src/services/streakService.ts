/**
 * Streak Service Requirements
 * 
 * Features:
 * 1. Streak Tracking:
 *    - Track daily reading streaks
 *    - Maintain current streak count
 *    - Record longest streak achieved
 *    - Store streak start date
 *    - Keep history of all completed dates
 * 
 * 2. Streak Rules:
 *    - Streak continues if user reads on consecutive days
 *    - Streak breaks if user misses a day
 *    - Multiple reads on same day count as one
 *    - Streak starts fresh after a break
 * 
 * 3. Data Management:
 *    - Initialize streak for new users
 *    - Update streak when article is completed
 *    - Preserve complete reading history
 *    - Handle timezone-safe date comparisons
 * 
 * 4. Data Structure:
 *    - Current streak count
 *    - Longest streak record
 *    - Last read date
 *    - Streak start date
 *    - Array of all completed dates
 */

import { ref, get, set, update } from 'firebase/database';
import { db } from '../config/firebase';

export interface UserStreak {
  currentStreak: number;
  longestStreak: number;
  lastReadDate: string;  // ISO date string
  streakStartDate: string;  // ISO date string
  completedDates: string[];  // Array of ISO date strings for completed days
}

export const streakService = {
  getUserStreak: async (userId: string): Promise<UserStreak | null> => {
    const streakRef = ref(db, `users/${userId}/streak`);
    const snapshot = await get(streakRef);
    if (snapshot.exists()) {
      return snapshot.val();
    }
    return null;
  },

  updateUserStreak: async (userId: string): Promise<void> => {
    const streakRef = ref(db, `users/${userId}/streak`);
    const snapshot = await get(streakRef);
    const today = new Date().toLocaleDateString('en-CA');

    if (!snapshot.exists()) {
      // Initialize streak for first-time user
      await set(streakRef, {
        currentStreak: 1,
        longestStreak: 1,
        lastReadDate: today,
        streakStartDate: today,
        completedDates: [today]
      });
      return;
    }

    const streakData = snapshot.val();
    const newCompletedDates = [...(streakData.completedDates || [])];
    if (!newCompletedDates.includes(today)) {
      newCompletedDates.push(today);
    }
    
    // If already read today, just ensure today's date is in completedDates
    if (streakData.lastReadDate === today) {
      if (!streakData.completedDates.includes(today)) {
        await update(streakRef, {
          completedDates: newCompletedDates
        });
      }
      return;
    }

    // Check if the last read was yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toLocaleDateString('en-CA');

    if (streakData.lastReadDate === yesterdayStr) {
      // Continue streak
      const newStreak = streakData.currentStreak + 1;

      await update(streakRef, {
        currentStreak: newStreak,
        longestStreak: Math.max(newStreak, streakData.longestStreak),
        lastReadDate: today,
        completedDates: newCompletedDates
      });
    } else {
      // Break streak but maintain history
      await update(streakRef, {
        currentStreak: 1,
        lastReadDate: today,
        streakStartDate: today,
        completedDates: newCompletedDates  // Keep the history, just add today
      });
    }
  }
}; 