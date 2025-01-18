import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { StreakDisplay } from '../StreakDisplay';
import { AuthContext } from '../../contexts/AuthContext';
import { streakService } from '../../services/streakService';

// Mock streakService
vi.mock('../../services/streakService', () => ({
  streakService: {
    getUserStreak: vi.fn()
  }
}));

describe('StreakDisplay', () => {
  const mockUser = {
    id: 'test-user',
    email: 'test@example.com',
    displayName: 'Test User'
  };

  const mockAuthContext = {
    user: mockUser,
    loading: false,
    setUser: vi.fn(),
    signIn: vi.fn(),
    signInWithGoogle: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should not render when loading', async () => {
    await act(async () => {
      render(
        <AuthContext.Provider value={{ ...mockAuthContext, loading: true }}>
          <StreakDisplay />
        </AuthContext.Provider>
      );
    });
    expect(screen.queryByText('天')).not.toBeInTheDocument();
  });

  it('should not render when user is not logged in', async () => {
    await act(async () => {
      render(
        <AuthContext.Provider value={{ ...mockAuthContext, user: null }}>
          <StreakDisplay />
        </AuthContext.Provider>
      );
    });
    expect(screen.queryByText('天')).not.toBeInTheDocument();
  });

  it('should display streak information when logged in', async () => {
    const mockStreak = {
      currentStreak: 3,
      longestStreak: 5,
      lastReadDate: new Date().toISOString().split('T')[0],
      streakStartDate: new Date().toISOString().split('T')[0],
      completedDates: [new Date().toISOString().split('T')[0]]
    };

    (streakService.getUserStreak as ReturnType<typeof vi.fn>).mockResolvedValue(mockStreak);

    await act(async () => {
      render(
        <AuthContext.Provider value={mockAuthContext}>
          <StreakDisplay />
        </AuthContext.Provider>
      );
    });

    expect(await screen.findByText('3')).toBeInTheDocument();
    expect(screen.getByText('天')).toBeInTheDocument();
  });
}); 