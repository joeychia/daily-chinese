import { ref, get, set, onValue, off } from 'firebase/database';
import { db } from '../config/firebase';
import { ChineseWord } from '../types/reading';

export interface ArticleProgress {
  readingDuration: number;  // in seconds
  quizScore?: number;      // score out of 100
  completedAt?: string;    // ISO date string
}

export const getWordBank = async (userId: string): Promise<ChineseWord[]> => {
  const userRef = ref(db, `users/${userId}/wordBank`);
  const snapshot = await get(userRef);
  return snapshot.val() || [];
};

export const saveWordBank = async (userId: string, wordBank: ChineseWord[]): Promise<void> => {
  const userRef = ref(db, `users/${userId}/wordBank`);
  await set(userRef, wordBank);
};

export const subscribeToWordBank = (userId: string, callback: (wordBank: ChineseWord[]) => void) => {
  const userRef = ref(db, `users/${userId}/wordBank`);
  onValue(userRef, (snapshot) => {
    const wordBank = snapshot.val() || [];
    callback(wordBank);
  });

  return () => {
    off(userRef);
  };
};

export const getTheme = async (userId: string): Promise<string | null> => {
  const userRef = ref(db, `users/${userId}/theme`);
  const snapshot = await get(userRef);
  return snapshot.val();
};

export const saveTheme = async (userId: string, theme: string): Promise<void> => {
  const userRef = ref(db, `users/${userId}/theme`);
  await set(userRef, theme);
};

export const subscribeToTheme = (userId: string, callback: (theme: string) => void) => {
  const userRef = ref(db, `users/${userId}/theme`);
  onValue(userRef, (snapshot) => {
    const theme = snapshot.val();
    if (theme) {
      callback(theme);
    }
  });

  return () => {
    off(userRef);
  };
};

export const saveQuizCompletion = async (
  userId: string,
  articleId: string,
  score: number,
  duration: number
): Promise<void> => {
  const userArticleRef = ref(db, `users/${userId}/articles/${articleId}`);
  
  // Get existing data first
  const snapshot = await get(userArticleRef);
  const existingData = snapshot.val() || {};
  
  // Merge with new data
  const updatedData = {
    ...existingData,
    quizScore: score,
    readingDuration: duration,
    completedAt: new Date().toISOString(),
  };

  await set(userArticleRef, updatedData);
}; 