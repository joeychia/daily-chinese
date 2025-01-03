import { articleService } from '../articleService';
import { ref, get, set } from 'firebase/database';

// Mock Firebase
jest.mock('firebase/database', () => ({
  ref: jest.fn(() => ({})),
  get: jest.fn(),
  set: jest.fn()
}));

jest.mock('../../config/firebase', () => ({
  db: {}
}));

describe('articleService - Streak Management', () => {
  const mockUserId = 'test-user-123';
  const today = '2024-01-02';
  const yesterday = '2024-01-01';
  const twoDaysAgo = '2023-12-31';

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock the current date
    jest.useFakeTimers();
    jest.setSystemTime(new Date(today));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('updateUserStreak', () => {
    it('should initialize streak for first-time user', async () => {
      // Mock no existing streak
      (get as jest.Mock).mockResolvedValueOnce({ exists: () => false });
      (ref as jest.Mock).mockReturnValue({});
      
      await articleService.updateUserStreak(mockUserId);

      expect(set).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          currentStreak: 1,
          longestStreak: 1,
          lastReadDate: today,
          streakStartDate: today,
          completedDates: [today]
        })
      );
    });

    it('should maintain streak when reading on same day', async () => {
      const existingStreak = {
        currentStreak: 5,
        longestStreak: 7,
        lastReadDate: today,
        streakStartDate: '2023-12-28',
        completedDates: [twoDaysAgo, yesterday, today]
      };

      (get as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        val: () => existingStreak
      });
      (ref as jest.Mock).mockReturnValue({});

      await articleService.updateUserStreak(mockUserId);

      expect(set).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          currentStreak: 5,
          longestStreak: 7,
          lastReadDate: today,
          completedDates: [twoDaysAgo, yesterday, today]
        })
      );
    });

    it('should increment streak when reading on consecutive days', async () => {
      const existingStreak = {
        currentStreak: 3,
        longestStreak: 5,
        lastReadDate: yesterday,
        streakStartDate: '2023-12-30',
        completedDates: [twoDaysAgo, yesterday]
      };

      (get as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        val: () => existingStreak
      });
      (ref as jest.Mock).mockReturnValue({});

      await articleService.updateUserStreak(mockUserId);

      expect(set).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          currentStreak: 4,
          longestStreak: 5,
          lastReadDate: today,
          completedDates: [twoDaysAgo, yesterday, today]
        })
      );
    });

    it('should break streak and start new one when missing a day', async () => {
      const existingStreak = {
        currentStreak: 5,
        longestStreak: 7,
        lastReadDate: twoDaysAgo,
        streakStartDate: '2023-12-27',
        completedDates: [twoDaysAgo]
      };

      (get as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        val: () => existingStreak
      });
      (ref as jest.Mock).mockReturnValue({});

      await articleService.updateUserStreak(mockUserId);

      expect(set).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          currentStreak: 1,
          longestStreak: 7,
          lastReadDate: today,
          streakStartDate: today,
          completedDates: [today]
        })
      );
    });

    it('should update longest streak when current streak exceeds it', async () => {
      const existingStreak = {
        currentStreak: 7,
        longestStreak: 7,
        lastReadDate: yesterday,
        streakStartDate: '2023-12-26',
        completedDates: Array.from({ length: 7 }, (_, i) => {
          const date = new Date(yesterday);
          date.setDate(date.getDate() - i);
          return date.toISOString().split('T')[0];
        })
      };

      (get as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        val: () => existingStreak
      });
      (ref as jest.Mock).mockReturnValue({});

      await articleService.updateUserStreak(mockUserId);

      expect(set).toHaveBeenCalledWith(
        {},
        expect.objectContaining({
          currentStreak: 8,
          longestStreak: 8,
          lastReadDate: today
        })
      );
    });
  });

  describe('getUserStreak', () => {
    it('should return null when no streak exists', async () => {
      (get as jest.Mock).mockResolvedValueOnce({ exists: () => false });
      (ref as jest.Mock).mockReturnValue({});

      const result = await articleService.getUserStreak(mockUserId);
      expect(result).toBeNull();
    });

    it('should return streak data when it exists', async () => {
      const mockStreak = {
        currentStreak: 3,
        longestStreak: 5,
        lastReadDate: today,
        streakStartDate: yesterday,
        completedDates: [yesterday, today]
      };

      (get as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        val: () => mockStreak
      });
      (ref as jest.Mock).mockReturnValue({});

      const result = await articleService.getUserStreak(mockUserId);
      expect(result).toEqual(mockStreak);
    });
  });
}); 