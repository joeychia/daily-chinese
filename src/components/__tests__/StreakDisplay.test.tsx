/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StreakDisplay } from '../StreakDisplay';
import { articleService } from '../../services/articleService';
import { AuthContext } from '../../contexts/AuthContext';

// Mock articleService
jest.mock('../../services/articleService');

describe('StreakDisplay', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    displayName: 'Test User'
  };
  const mockStreak = {
    currentStreak: 5,
    longestStreak: 7,
    lastReadDate: '2024-01-05',
    streakStartDate: '2024-01-01',
    completedDates: ['2024-01-05', '2024-01-04', '2024-01-03', '2024-01-02', '2024-01-01']
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Set a fixed date that matches our test data
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-05'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const renderWithAuth = (component: React.ReactNode) => {
    return render(
      <AuthContext.Provider value={{ user: mockUser, loading: false }}>
        {component}
      </AuthContext.Provider>
    );
  };

  it('should display current streak', async () => {
    (articleService.getUserStreak as jest.Mock).mockResolvedValueOnce(mockStreak);

    renderWithAuth(<StreakDisplay />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
      expect(screen.getByText('天')).toBeInTheDocument();
    });
  });

  it('should display longest streak when different from current', async () => {
    (articleService.getUserStreak as jest.Mock).mockResolvedValueOnce(mockStreak);

    renderWithAuth(<StreakDisplay />);

    await waitFor(() => {
      expect(screen.getByText('最长连续：7天')).toBeInTheDocument();
    });
  });

  it('should not display longest streak when equal to current', async () => {
    const equalStreak = { ...mockStreak, longestStreak: 5 };
    (articleService.getUserStreak as jest.Mock).mockResolvedValueOnce(equalStreak);

    renderWithAuth(<StreakDisplay />);

    await waitFor(() => {
      expect(screen.queryByText('最长连续：5天')).not.toBeInTheDocument();
    });
  });

  it('should show streak panel when clicked', async () => {
    (articleService.getUserStreak as jest.Mock).mockResolvedValueOnce(mockStreak);

    renderWithAuth(<StreakDisplay />);

    await waitFor(() => {
      const streakDisplay = screen.getByText('5');
      fireEvent.click(streakDisplay);
    });

    expect(screen.getByText('阅读记录')).toBeInTheDocument();
    expect(screen.getByText('当前连续')).toBeInTheDocument();
    expect(screen.getByText('最长连续')).toBeInTheDocument();
  });

  it('should handle null streak data', async () => {
    (articleService.getUserStreak as jest.Mock).mockResolvedValueOnce(null);

    renderWithAuth(<StreakDisplay />);

    await waitFor(() => {
      expect(screen.getByText('0')).toBeInTheDocument();
      expect(screen.getByText('天')).toBeInTheDocument();
    });
  });

  it('should not render when user is not authenticated', () => {
    render(
      <AuthContext.Provider value={{ user: null, loading: false }}>
        <StreakDisplay />
      </AuthContext.Provider>
    );

    expect(screen.queryByText('天')).not.toBeInTheDocument();
  });

  it('should refresh streak data when refreshTrigger changes', async () => {
    (articleService.getUserStreak as jest.Mock)
      .mockResolvedValueOnce({ ...mockStreak, currentStreak: 5 })
      .mockResolvedValueOnce({ ...mockStreak, currentStreak: 6 });

    const { rerender } = renderWithAuth(<StreakDisplay refreshTrigger={0} />);

    await waitFor(() => {
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    rerender(
      <AuthContext.Provider value={{ user: mockUser, loading: false }}>
        <StreakDisplay refreshTrigger={1} />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('6')).toBeInTheDocument();
    });
  });

  it('should show fire emoji on days with streak', async () => {
    (articleService.getUserStreak as jest.Mock).mockResolvedValueOnce(mockStreak);

    renderWithAuth(<StreakDisplay />);

    // Click to open the streak panel
    await waitFor(() => {
      const streakDisplay = screen.getByText('5');
      fireEvent.click(streakDisplay);
    });

    // Wait for the calendar to render and verify fire emojis
    await waitFor(() => {
      const fireEmojis = screen.getAllByTestId('calendar-fire-emoji');
      expect(fireEmojis.length).toBe(mockStreak.completedDates.length);
    });

    // Verify that the legend shows completed status
    expect(screen.getByText('已完成')).toBeInTheDocument();
  });
}); 