/** @jest-environment jsdom */
import { render, screen, fireEvent } from '@testing-library/react';
import { StreakPanel } from '../StreakPanel';

describe('StreakPanel', () => {
  const mockStreak = {
    currentStreak: 5,
    longestStreak: 7,
    lastReadDate: '2024-01-02',
    streakStartDate: '2023-12-29',
    completedDates: ['2024-01-02', '2024-01-01', '2024-01-03', '2024-01-04', '2024-01-05']
  };

  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-05'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should not render when isOpen is false', () => {
    render(
      <StreakPanel isOpen={false} onClose={mockOnClose} streak={mockStreak} />
    );

    expect(screen.queryByText('阅读记录')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <StreakPanel isOpen={true} onClose={mockOnClose} streak={mockStreak} />
    );

    expect(screen.getByText('阅读记录')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('当前连续')).toBeInTheDocument();
    expect(screen.getByText('最长连续')).toBeInTheDocument();
  });

  it('should call onClose when clicking the close button', () => {
    render(
      <StreakPanel isOpen={true} onClose={mockOnClose} streak={mockStreak} />
    );

    const closeButton = screen.getByText('✕');
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should call onClose when clicking the overlay', () => {
    render(
      <StreakPanel isOpen={true} onClose={mockOnClose} streak={mockStreak} />
    );

    const overlay = screen.getByTestId('streak-panel-overlay');
    fireEvent.click(overlay);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should handle null streak data', () => {
    render(
      <StreakPanel isOpen={true} onClose={mockOnClose} streak={null} />
    );

    const zeros = screen.getAllByText('0');
    expect(zeros).toHaveLength(2);
  });

  it('should show completed dates with fire emoji', () => {
    render(
      <StreakPanel isOpen={true} onClose={mockOnClose} streak={mockStreak} />
    );

    const fireEmojis = screen.getAllByTestId('calendar-fire-emoji');
    expect(fireEmojis.length).toBe(mockStreak.completedDates.length);
  });

  it('should show legend with completed and incomplete indicators', () => {
    render(
      <StreakPanel isOpen={true} onClose={mockOnClose} streak={mockStreak} />
    );

    expect(screen.getByText('已完成')).toBeInTheDocument();
    expect(screen.getByText('未完成')).toBeInTheDocument();
  });
}); 