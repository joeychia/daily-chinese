import { ref, get, set, onValue, off, update } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { db } from '../config/firebase';
import { auth } from '../config/firebase';
import { ChineseWord } from '../data/sampleText';

export interface CharacterMasteryData {
  [character: string]: number;
}

export interface DailyStats {
  date: string;  // ISO date string (YYYY-MM-DD)
  totalChars: number;
  mastered: number;
  familiar: number;
  learned: number;
  notFamiliar: number;
  unknown: number;
}

export interface ArticleFeedback {
  enjoyment: number;  // 1-3
  difficulty: number; // 1-3
  timestamp: string;
}

export interface UserDataService {
  // Character Mastery Methods
  getCharacterMastery: () => Promise<CharacterMasteryData>;
  updateCharacterMastery: (characters: string[], mastery: number) => Promise<void>;

  // Word Bank Methods
  getWordBank: (userId: string) => Promise<ChineseWord[]>;
  saveWordBank: (userId: string, wordBank: ChineseWord[]) => Promise<void>;
  subscribeToWordBank: (userId: string, callback: (wordBank: ChineseWord[]) => void) => void;

  // Theme Methods
  getTheme: (userId: string) => Promise<string>;
  saveTheme: (userId: string, theme: string) => Promise<void>;
  subscribeToTheme: (userId: string, callback: (theme: string) => void) => void;

  // Daily Stats Methods
  saveDailyStats: (stats: Omit<DailyStats, 'date'>) => Promise<void>;
  getDailyStats: (days: number) => Promise<DailyStats[]>;

  // Article Feedback Methods
  saveArticleFeedback: (userId: string, articleId: string, feedback: { enjoyment: number; difficulty: number }) => Promise<void>;

  // Article Read Status Methods
  hasReadArticle: (userId: string, articleId: string) => Promise<boolean>;
}

class UserDataServiceImpl implements UserDataService {
  // Character Mastery Methods
  async getCharacterMastery(): Promise<CharacterMasteryData> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const masteryRef = ref(db, `users/${user.uid}/characterMastery`);
      const snapshot = await get(masteryRef);
      return snapshot.val() || {};
    } catch (error) {
      console.error('Error getting character mastery:', error);
      throw error;
    }
  }

  async updateCharacterMastery(characters: string[], mastery: number, keepExisting: boolean = false) {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const masteryRef = ref(db, `users/${user.uid}/characterMastery`);
      const snapshot = await get(masteryRef);
      const currentMastery = snapshot.val() || {};
      
      const updates: CharacterMasteryData = {};
      characters.forEach(char => {
        updates[char] = keepExisting ? currentMastery[char] || mastery : mastery;
      });

      await update(masteryRef, updates);
    } catch (error) {
      console.error('Error updating character mastery:', error);
      throw error;
    }
  }

  // Word Bank Methods
  async getWordBank(userId: string): Promise<ChineseWord[]> {
    try {
      const userRef = ref(db, `users/${userId}/wordBank`);
      const snapshot = await get(userRef);
      return snapshot.val() || [];
    } catch (error) {
      console.error('Error getting word bank:', error);
      throw error;
    }
  }

  async saveWordBank(userId: string, wordBank: ChineseWord[]): Promise<void> {
    try {
      const userRef = ref(db, `users/${userId}/wordBank`);
      await set(userRef, wordBank);
    } catch (error) {
      console.error('Error saving word bank:', error);
      throw error;
    }
  }

  subscribeToWordBank(userId: string, callback: (wordBank: ChineseWord[]) => void) {
    const userRef = ref(db, `users/${userId}/wordBank`);
    onValue(userRef, (snapshot) => {
      const wordBank = snapshot.val() || [];
      callback(wordBank);
    });

    return () => {
      off(userRef);
    };
  }

  // Theme Methods
  async getTheme(userId: string): Promise<string> {
    try {
      const userRef = ref(db, `users/${userId}/theme`);
      const snapshot = await get(userRef);
      return snapshot.val() || 'candy';
    } catch (error) {
      console.error('Error getting theme:', error);
      throw error;
    }
  }

  async saveTheme(userId: string, theme: string): Promise<void> {
    try {
      const userRef = ref(db, `users/${userId}/theme`);
      await set(userRef, theme);
    } catch (error) {
      console.error('Error saving theme:', error);
      throw error;
    }
  }

  subscribeToTheme(userId: string, callback: (theme: string) => void) {
    const userRef = ref(db, `users/${userId}/theme`);
    onValue(userRef, (snapshot) => {
      const theme = snapshot.val() || 'candy';
      callback(theme);
    });

    return () => {
      off(userRef);
    };
  }

  async saveDailyStats(stats: Omit<DailyStats, 'date'>): Promise<void> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const statsRef = ref(db, `users/${user.uid}/dailyStats/${today}`);
      
      await set(statsRef, {
        date: today,
        ...stats
      });
    } catch (error) {
      console.error('Error saving daily stats:', error);
      throw error;
    }
  }

  async getDailyStats(days: number = 30): Promise<DailyStats[]> {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const statsRef = ref(db, `users/${user.uid}/dailyStats`);
      const snapshot = await get(statsRef);
      const stats = snapshot.val() || {};

      // Convert to array and sort by date
      const statsArray = Object.values(stats) as DailyStats[];
      statsArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      // Return only the specified number of days
      return statsArray.slice(0, days);
    } catch (error) {
      console.error('Error getting daily stats:', error);
      throw error;
    }
  }

  async hasReadArticle(userId: string, articleId: string): Promise<boolean> {
    try {
      const userRef = ref(db, `users/${userId}/articles/${articleId}`);
      const snapshot = await get(userRef);
      return snapshot.exists();
    } catch (error) {
      console.error('Error checking article read status:', error);
      return false;
    }
  }

  async saveArticleFeedback(
    userId: string,
    articleId: string,
    feedback: { enjoyment: number; difficulty: number }
  ): Promise<void> {
    try {
      const feedbackRef = ref(db, `users/${userId}/articles/${articleId}/feedback`);
      await set(feedbackRef, feedback);
    } catch (error) {
      console.error('Error saving article feedback:', error);
    }
  }
}

export const userDataService = new UserDataServiceImpl();

// Export individual functions for backward compatibility
export const getWordBank = (userId: string) => userDataService.getWordBank(userId);
export const saveWordBank = (userId: string, wordBank: ChineseWord[]) => userDataService.saveWordBank(userId, wordBank);
export const subscribeToWordBank = (userId: string, callback: (wordBank: ChineseWord[]) => void) => userDataService.subscribeToWordBank(userId, callback);
export const getTheme = (userId: string) => userDataService.getTheme(userId);
export const saveTheme = (userId: string, theme: string) => userDataService.saveTheme(userId, theme);
export const subscribeToTheme = (userId: string, callback: (theme: string) => void) => userDataService.subscribeToTheme(userId, callback);

export const getCharacterMastery = async (): Promise<Record<string, number>> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');

  const masteryRef = ref(db, `users/${user.uid}/characterMastery`);
  const snapshot = await get(masteryRef);
  return snapshot.val() || {};
};

export const updateCharacterMastery = async (character: string, mastery: number): Promise<void> => {
  const user = auth.currentUser;
  if (!user) throw new Error('No user logged in');

  const masteryRef = ref(db, `users/${user.uid}/characterMastery/${character}`);
  await set(masteryRef, mastery);
};

export const saveArticleFeedback = async (
  userId: string,
  articleId: string,
  feedback: { enjoyment: number; difficulty: number }
): Promise<void> => {
  const userArticleRef = ref(db, `users/${userId}/articles/${articleId}`);
  const currentSnapshot = await get(userArticleRef);
  const currentData = currentSnapshot.exists() ? currentSnapshot.val() : {};

  await update(userArticleRef, {
    ...currentData,
    feedback: {
      ...feedback,
      timestamp: new Date().toISOString()
    }
  });
}; 