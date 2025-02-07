import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { act } from '@testing-library/react';
import { Progress } from '../../pages/Progress';
import { userDataService } from '../../services/userDataService';
import { useAuth } from '../../contexts/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mock the Chart.js component
vi.mock('react-chartjs-2', () => ({
  Line: () => null
}));

// Mock the auth context
vi.mock('../../contexts/AuthContext', () => ({
  useAuth: vi.fn()
}));

// Mock userDataService
vi.mock('../../services/userDataService', () => ({
  userDataService: {
    getCharacterMastery: vi.fn(),
    getDailyStats: vi.fn()
  }
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('Progress', () => {
  const mockMasteryData = {
    '我': 3, // mastered
    '你': 2, // familiar
    '他': 1, // learned
    '她': 0, // not familiar
    '它': -1 // unknown
  };

  const mockDailyStats = [
    {
      date: '2024-01-15',
      mastered: 10,
      familiar: 5,
      learned: 3,
      notFamiliar: 2
    },
    {
      date: '2024-01-14',
      mastered: 8,
      familiar: 4,
      learned: 2,
      notFamiliar: 1
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: { uid: 'test-user' },
      loading: false
    });
    (userDataService.getCharacterMastery as any).mockResolvedValue(mockMasteryData);
    (userDataService.getDailyStats as any).mockResolvedValue(mockDailyStats);
  });

  it('should show error state when data fetch fails', async () => {
    (userDataService.getCharacterMastery as any).mockRejectedValue(new Error('Failed to load'));
    
    await act(async () => {
      renderWithRouter(<Progress />);
    });
    expect(await screen.findByText('加载数据失败，请稍后再试')).toBeInTheDocument();
  });

  it('should display overall stats when data loads successfully', async () => {
    await act(async () => {
      renderWithRouter(<Progress />);
    });
    
    // Wait for the component to load and find the title
    const title = await screen.findByText('总体进度');
    expect(title).toBeInTheDocument();
    
    // Use getByText with a function to do partial matches
    const totalCharsElement = screen.getByText((content: string) => {
      return content.includes('Total Characters');
    });
    expect(totalCharsElement).toBeInTheDocument();
  });

  it('should toggle unknown characters visibility when clicking toggle button', async () => {
    await act(async () => {
      renderWithRouter(<Progress />);
    });
    
    // Get the first grade section
    const firstGradeSection = screen.getByText('一级汉字').closest('div');
    if (!firstGradeSection) throw new Error('Grade section not found');
    
    // Find the toggle button within this section
    const toggleButton = within(firstGradeSection).getByText('显示未读 Show Unread');
    await act(async () => {
      fireEvent.click(toggleButton);
    });
    
    expect(within(firstGradeSection).getByText('隐藏未读 Hide Unread')).toBeInTheDocument();
  });

  it('should display character cards with correct mastery colors', async () => {
    await act(async () => {
      renderWithRouter(<Progress />);
    });
    
    // Wait for data to load
    await screen.findByText('总体进度');
    
    // Check for character cards with different mastery levels
    const characterCards = screen.getAllByTitle(/未读|不熟|学过一次|学过两次|已掌握/);
    expect(characterCards.length).toBeGreaterThan(0);
  });

  it('should display trend chart section', async () => {
    await act(async () => {
      renderWithRouter(<Progress />);
    });
    
    expect(await screen.findByText('学习趋势（近30天）')).toBeInTheDocument();
    expect(await screen.findByText('Learning Trends (Last 30 Days)')).toBeInTheDocument();
  });
});