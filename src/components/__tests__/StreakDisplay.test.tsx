/** @jest-environment jsdom */
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { StreakDisplay } from '../StreakDisplay';
import { articleService } from '../../services/articleService';
import { AuthContext } from '../../contexts/AuthContext';

// Mock articleService
jest.mock('../../services/articleService');

describe('StreakDisplay', () => {
  const mockUser = { id: 'test-user-123' };
  const mockStreak = {
    currentStreak: 5,
    longestStreak: 7,
    lastReadDate: '2024-01-02',
    streakStartDate: '2023-12-29',
    completedDates: ['2024-01-02', '2024-01-01', '2023-12-31', '2023-12-30', '2023-12-29']
  };

  beforeEach(() => {
    jest.clearAllMocks();
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
}); 