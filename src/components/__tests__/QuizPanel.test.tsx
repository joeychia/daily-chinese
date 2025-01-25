import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { QuizPanel } from '../QuizPanel';
import { AuthProvider } from '../../contexts/AuthContext';
import { userDataService } from '../../services/userDataService';
import { rewardsService } from '../../services/rewardsService';
import { analyticsService } from '../../services/analyticsService';
import { DatabaseQuiz } from '../../services/articleService';

// Mock the auth context
vi.mock('../../contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: () => ({
    user: { id: 'test-user-id' },
    loading: false
  })
}));

// Mock the services
vi.mock('../../services/userDataService', () => ({
  userDataService: {
    hasReadArticle: vi.fn(),
    updateCharacterMastery: vi.fn()
  }
}));

vi.mock('../../services/rewardsService', () => ({
  rewardsService: {
    addPoints: vi.fn()
  }
}));

vi.mock('../../services/analyticsService', () => ({
  analyticsService: {
    trackQuizCompletion: vi.fn()
  }
}));

const mockQuizzes: DatabaseQuiz[] = [
  {
    question: '你好',
    options: ['hello', 'goodbye', 'thanks'],
    correctAnswer: 0
  },
  {
    question: '再见',
    options: ['hello', 'goodbye', 'thanks'],
    correctAnswer: 1
  }
];

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  quizzes: mockQuizzes,
  onComplete: vi.fn(),
  articleId: 'test-article',
  onPointsUpdate: vi.fn()
};

describe('QuizPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (userDataService.hasReadArticle as any).mockResolvedValue(false);
  });

  it('renders quiz questions and options', () => {
    render(
      <AuthProvider>
        <QuizPanel {...defaultProps} />
      </AuthProvider>
    );

    // Check if first question is rendered
    expect(screen.getByText('问题 1 / 2')).toBeInTheDocument();
    expect(screen.getByText('你')).toBeInTheDocument();
    expect(screen.getByText('好')).toBeInTheDocument();
    
    // Check if options are rendered
    mockQuizzes[0].options.forEach(option => {
      // Each character should be rendered separately
      option.split('').forEach(char => {
        expect(screen.getAllByText(char).length).toBeGreaterThan(0);
      });
    });
  });

  it('handles answer selection and submission', async () => {
    render(
      <AuthProvider>
        <QuizPanel {...defaultProps} />
      </AuthProvider>
    );

    // Select first option by clicking its button
    const options = screen.getAllByRole('button').filter(button => 
      button.textContent?.includes('h') && 
      button.textContent?.includes('e') && 
      button.textContent?.includes('l') && 
      button.textContent?.includes('o')
    );
    fireEvent.click(options[0]);
    
    // Submit answer
    const submitButton = screen.getByText('检查答案');
    fireEvent.click(submitButton);

    // Should show next question button
    await waitFor(() => {
      expect(screen.getByText('下一题')).toBeInTheDocument();
    });

    // Move to next question
    fireEvent.click(screen.getByText('下一题'));

    // Should show second question
    expect(screen.getByText('问题 2 / 2')).toBeInTheDocument();
    expect(screen.getByText('再')).toBeInTheDocument();
    expect(screen.getByText('见')).toBeInTheDocument();
  });

  it('tracks character clicks for learning', async () => {
    render(
      <AuthProvider>
        <QuizPanel {...defaultProps} />
      </AuthProvider>
    );

    // Click on characters
    fireEvent.click(screen.getByText('你'));
    fireEvent.click(screen.getByText('好'));

    // Select and submit answer
    const options = screen.getAllByRole('button').filter(button => 
      button.textContent?.includes('h') && 
      button.textContent?.includes('e') && 
      button.textContent?.includes('l') && 
      button.textContent?.includes('o')
    );
    fireEvent.click(options[0]);
    fireEvent.click(screen.getByText('检查答案'));
    fireEvent.click(screen.getByText('下一题'));

    // Verify character mastery update was called
    await waitFor(() => {
      expect(userDataService.updateCharacterMastery).toHaveBeenCalledWith(['你', '好'], 0);
    });
  });

  it('awards points for correct answers when article is unread', async () => {
    render(
      <AuthProvider>
        <QuizPanel {...defaultProps} />
      </AuthProvider>
    );

    // Select correct answer
    const options = screen.getAllByRole('button').filter(button => 
      button.textContent?.includes('h') && 
      button.textContent?.includes('e') && 
      button.textContent?.includes('l') && 
      button.textContent?.includes('o')
    );
    fireEvent.click(options[0]);
    fireEvent.click(screen.getByText('检查答案'));

    // Wait for points to be awarded
    await waitFor(() => {
      expect(rewardsService.addPoints).toHaveBeenCalledWith('test-user-id', 10, 'quiz');
      expect(defaultProps.onPointsUpdate).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('shows final results after completing all questions', async () => {
    render(
      <AuthProvider>
        <QuizPanel {...defaultProps} />
      </AuthProvider>
    );

    // Complete first question
    const helloOption = screen.getAllByRole('button').filter(button => 
      button.textContent?.includes('h') && 
      button.textContent?.includes('e') && 
      button.textContent?.includes('l') && 
      button.textContent?.includes('o')
    )[0];
    fireEvent.click(helloOption);
    fireEvent.click(screen.getByText('检查答案'));
    fireEvent.click(screen.getByText('下一题'));

    // Complete second question
    const goodbyeOption = screen.getAllByRole('button').filter(button => 
      button.textContent?.includes('g') && 
      button.textContent?.includes('o') && 
      button.textContent?.includes('d') && 
      button.textContent?.includes('b') && 
      button.textContent?.includes('y') && 
      button.textContent?.includes('e')
    )[0];
    fireEvent.click(goodbyeOption);
    fireEvent.click(screen.getByText('检查答案'));
    fireEvent.click(screen.getByText('完成测验'));

    // Verify results are shown
    await waitFor(() => {
      expect(screen.getByText('测验结果')).toBeInTheDocument();
      expect(screen.getByText('得分：100%')).toBeInTheDocument();
      expect(screen.getByText('正确：2 / 2')).toBeInTheDocument();
    });

    // Verify analytics were tracked
    await waitFor(() => {
      expect(analyticsService.trackQuizCompletion).toHaveBeenCalledWith(2, 2);
      expect(defaultProps.onComplete).toHaveBeenCalled();
    });
  });

  it('does not award points for correct answers when article is already read', async () => {
    (userDataService.hasReadArticle as any).mockResolvedValue(true);

    render(
      <AuthProvider>
        <QuizPanel {...defaultProps} />
      </AuthProvider>
    );

    // Wait for hasReadArticle to be set
    await new Promise(resolve => setTimeout(resolve, 0));

    // Select correct answer
    const options = screen.getAllByRole('button').filter(button => 
      button.textContent?.includes('h') && 
      button.textContent?.includes('e') && 
      button.textContent?.includes('l') && 
      button.textContent?.includes('o')
    );
    fireEvent.click(options[0]);
    fireEvent.click(screen.getByText('检查答案'));

    // Verify no points were awarded
    await waitFor(() => {
      expect(rewardsService.addPoints).not.toHaveBeenCalled();
      expect(defaultProps.onPointsUpdate).not.toHaveBeenCalled();
    });
  });
}); 