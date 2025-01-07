import { ref, get, set, onValue, off, update } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { db } from '../config/firebase';
import { auth } from '../config/firebase';
import { ChineseWord } from '../data/sampleText';

export interface CharacterMasteryData {
  [character: string]: number;
}

class UserDataService {
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

  async updateCharacterMastery(characters: string[], mastery: number) {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      const masteryRef = ref(db, `users/${user.uid}/characterMastery`);
      const snapshot = await get(masteryRef);
      const currentMastery = snapshot.val() || {};
      
      const updates: CharacterMasteryData = {};
      characters.forEach(char => {
        updates[char] = mastery;
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
}

export const userDataService = new UserDataService();

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