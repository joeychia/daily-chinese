import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ref, get, set, update } from 'firebase/database';
import { streakService } from './streakService';
import { db } from '../config/firebase';

// Mock Firebase
vi.mock('firebase/database', () => ({
  ref: vi.fn(),
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn()
}));

vi.mock('../config/firebase', () => ({
  db: {}
}));

describe('streakService', () => {
  const userId = 'testUser123';
  const mockToday = '2024-01-15';
  const mockYesterday = '2024-01-14';
  const mockTwoDaysAgo = '2024-01-13';

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock toLocaleDateString to return mockToday by default
    vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValue(mockToday);
    
    // Mock setDate to handle yesterday's date
    vi.spyOn(Date.prototype, 'setDate').mockImplementation(function(this: Date, date: number) {
      if (date === new Date().getDate() - 1) {
        vi.spyOn(Date.prototype, 'toLocaleDateString').mockReturnValueOnce(mockYesterday);
      }
      return date;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('getUserStreak', () => {
    it('should return null if no streak exists', async () => {
      (ref as any).mockReturnValue('streakRef');
      (get as any).mockResolvedValue({ exists: () => false });

      const result = await streakService.getUserStreak(userId);
      expect(result).toBeNull();
      expect(ref).toHaveBeenCalledWith(db, `users/${userId}/streak`);
    });

    it('should return streak data if it exists', async () => {
      const mockStreak = {
        currentStreak: 5,
        longestStreak: 10,
        lastReadDate: mockToday,
        streakStartDate: mockTwoDaysAgo,
        completedDates: [mockTwoDaysAgo, mockYesterday, mockToday]
      };

      (ref as any).mockReturnValue('streakRef');
      (get as any).mockResolvedValue({
        exists: () => true,
        val: () => mockStreak
      });

      const result = await streakService.getUserStreak(userId);
      expect(result).toEqual(mockStreak);
    });
  });

  describe('updateUserStreak', () => {
    it('should initialize streak for new user', async () => {
      (ref as any).mockReturnValue('streakRef');
      (get as any).mockResolvedValue({ exists: () => false });

      await streakService.updateUserStreak(userId);

      expect(set).toHaveBeenCalledWith('streakRef', {
        currentStreak: 1,
        longestStreak: 1,
        lastReadDate: mockToday,
        streakStartDate: mockToday,
        completedDates: [mockToday]
      });
    });

    it('should only update completedDates if already read today', async () => {
      const mockStreak = {
        currentStreak: 3,
        longestStreak: 5,
        lastReadDate: mockToday,
        streakStartDate: mockTwoDaysAgo,
        completedDates: [mockTwoDaysAgo, mockYesterday]
      };

      (ref as any).mockReturnValue('streakRef');
      (get as any).mockResolvedValue({
        exists: () => true,
        val: () => mockStreak
      });

      await streakService.updateUserStreak(userId);

      expect(update).toHaveBeenCalledWith('streakRef', {
        completedDates: [mockTwoDaysAgo, mockYesterday, mockToday]
      });
    });

    it('should continue streak if read yesterday', async () => {
      const mockStreak = {
        currentStreak: 2,
        longestStreak: 5,
        lastReadDate: mockYesterday,
        streakStartDate: mockTwoDaysAgo,
        completedDates: [mockTwoDaysAgo, mockYesterday]
      };

      (ref as any).mockReturnValue('streakRef');
      (get as any).mockResolvedValue({
        exists: () => true,
        val: () => mockStreak
      });

      await streakService.updateUserStreak(userId);

      expect(update).toHaveBeenCalledWith('streakRef', {
        currentStreak: 3,
        longestStreak: 5,
        lastReadDate: mockToday,
        completedDates: [mockTwoDaysAgo, mockYesterday, mockToday]
      });
    });

    it('should break streak if missed a day', async () => {
      const mockStreak = {
        currentStreak: 5,
        longestStreak: 10,
        lastReadDate: mockTwoDaysAgo,
        streakStartDate: '2024-01-10',
        completedDates: ['2024-01-10', '2024-01-11', '2024-01-12', '2024-01-13']
      };

      (ref as any).mockReturnValue('streakRef');
      (get as any).mockResolvedValue({
        exists: () => true,
        val: () => mockStreak
      });

      await streakService.updateUserStreak(userId);

      expect(update).toHaveBeenCalledWith('streakRef', {
        currentStreak: 1,
        lastReadDate: mockToday,
        streakStartDate: mockToday,
        completedDates: [...mockStreak.completedDates, mockToday]
      });
    });

    it('should update longest streak when current streak exceeds it', async () => {
      const mockStreak = {
        currentStreak: 5,
        longestStreak: 5,
        lastReadDate: mockYesterday,
        streakStartDate: '2024-01-10',
        completedDates: ['2024-01-10', '2024-01-11', '2024-01-12', '2024-01-13', '2024-01-14']
      };

      (ref as any).mockReturnValue('streakRef');
      (get as any).mockResolvedValue({
        exists: () => true,
        val: () => mockStreak
      });

      await streakService.updateUserStreak(userId);

      expect(update).toHaveBeenCalledWith('streakRef', {
        currentStreak: 6,
        longestStreak: 6,
        lastReadDate: mockToday,
        completedDates: [...mockStreak.completedDates, mockToday]
      });
    });
  });
}); 