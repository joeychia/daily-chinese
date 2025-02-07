import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { Leaderboard } from './Leaderboard';
import { rewardsService } from '../services/rewardsService';
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock services
vi.mock('../services/rewardsService');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn()
  };
});

const mockUser = {
  id: 'test-user-id',
  displayName: 'Test User',
  email: 'test@example.com'
};

const mockLeaderboardEntries = [
  { id: 'user1', name: 'User One', points: 1000 },
  { id: 'user2', name: 'User Two', points: 800 },
  { id: 'user3', name: 'User Three', points: 600 }
];

describe('Leaderboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cleanup();
    (rewardsService.getLeaderboardByPeriod as ReturnType<typeof vi.fn>).mockResolvedValue(mockLeaderboardEntries);
    (rewardsService.getPoints as ReturnType<typeof vi.fn>).mockResolvedValue({ total: 500 });
    (rewardsService.syncToLeaderboard as ReturnType<typeof vi.fn>).mockResolvedValue(undefined);
  });

  afterEach(() => {
    cleanup();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <AuthContext.Provider value={{ 
          user: mockUser, 
          loading: false,
          setUser: () => {},
          signIn: async () => {},
          signInWithGoogle: async () => {},
          signUp: async () => {},
          signOut: async () => {}
        }}>
          <Leaderboard />
        </AuthContext.Provider>
      </MemoryRouter>
    );
  };

  it('shows loading state initially', () => {
    renderComponent();
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('displays leaderboard data after loading', async () => {
    // Mock the user points to avoid name prompt
    (rewardsService.getPoints as ReturnType<typeof vi.fn>).mockResolvedValue({ total: 500 });
    (rewardsService.getLeaderboardByPeriod as ReturnType<typeof vi.fn>).mockResolvedValue(mockLeaderboardEntries);
    
    renderComponent();
    
    // Wait for loading to complete and submit name prompt
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    // Submit the name prompt
    const submitButton = screen.getByText((content) => content === '确认');
    fireEvent.click(submitButton);

    // Now check for the leaderboard entries
    await waitFor(() => {
      expect(screen.getByText((content) => content === 'User One')).toBeInTheDocument();
      expect(screen.getByText('1000')).toBeInTheDocument();
    });
  });

  it('switches between different time periods', async () => {
    // Mock the user points to avoid name prompt
    (rewardsService.getPoints as ReturnType<typeof vi.fn>).mockResolvedValue({ total: 500 });
    (rewardsService.getLeaderboardByPeriod as ReturnType<typeof vi.fn>).mockResolvedValue(mockLeaderboardEntries);
    
    renderComponent();

    // Wait for loading to complete and submit name prompt
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    // Submit the name prompt
    const submitButton = screen.getByText((content) => content === '确认');
    fireEvent.click(submitButton);

    // Wait for leaderboard to load
    await waitFor(() => {
      const weekButton = screen.getByText((content) => content === '本周');
      expect(weekButton).toBeInTheDocument();
      fireEvent.click(weekButton);
      expect(rewardsService.getLeaderboardByPeriod).toHaveBeenCalledWith('week');

      const monthButton = screen.getByText((content) => content === '本月');
      fireEvent.click(monthButton);
      expect(rewardsService.getLeaderboardByPeriod).toHaveBeenCalledWith('month');

      const allTimeButton = screen.getByText((content) => content === '总排名');
      fireEvent.click(allTimeButton);
      expect(rewardsService.getLeaderboardByPeriod).toHaveBeenCalledWith('all');
    });
  });

  it('shows name prompt when user is not in leaderboard', async () => {
    (rewardsService.getLeaderboardByPeriod as ReturnType<typeof vi.fn>).mockResolvedValue([
      { id: 'other-user', name: 'Other User', points: 1000 }
    ]);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByText('加入排行榜')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('输入名字 / Enter name')).toBeInTheDocument();
    });
  });

  it('allows submitting name to join leaderboard', async () => {
    (rewardsService.getLeaderboardByPeriod as ReturnType<typeof vi.fn>)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(mockLeaderboardEntries);

    renderComponent();

    await waitFor(() => {
      expect(screen.getByPlaceholderText('输入名字 / Enter name')).toBeInTheDocument();
    });

    const input = screen.getByPlaceholderText('输入名字 / Enter name');
    fireEvent.change(input, { target: { value: 'New User' } });
    
    const submitButton = screen.getByText('确认');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(rewardsService.syncToLeaderboard).toHaveBeenCalledWith(
        mockUser.id,
        500,
        'New User'
      );
    });
  });

  it('highlights current user in the leaderboard', async () => {
    const entriesWithCurrentUser = [
      ...mockLeaderboardEntries,
      { id: mockUser.id, name: mockUser.displayName!, points: 700 }
    ];

    (rewardsService.getLeaderboardByPeriod as ReturnType<typeof vi.fn>)
      .mockResolvedValue(entriesWithCurrentUser);

    renderComponent();

    await waitFor(() => {
      const userEntry = screen.getByText('You');
      expect(userEntry).toBeInTheDocument();
      expect(userEntry.closest('div[class*="bg-blue-50"]')).toBeInTheDocument();
    });
  });

  
});